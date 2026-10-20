const { Prisma } = require('@prisma/client');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { generateBookingNumber } = require('../utils/bookingNumber');
const { assertRoomAvailable } = require('./availability.service');
const { calculateBookingPrice, nightsBetween } = require('./pricing.service');
const notificationService = require('./notification.service');
const settingsService = require('./hotelSetting.service');
const logger = require('../utils/logger');

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];

/**
 * Creates a booking end-to-end inside a single SERIALIZABLE transaction so
 * that two concurrent requests for the same room/date-range cannot both
 * succeed — the second transaction will either see the first request's
 * uncommitted-but-locked row via the overlap query re-run inside the
 * transaction, or Postgres will raise a serialization failure that we
 * translate into a clean 409 CONFLICT. The room's price is always resolved
 * server-side; the client never supplies a total.
 */
async function createBooking(customerId, input) {
  const { roomId, checkInDate, checkOutDate, numAdults, numChildren, specialRequests, guests, discountCode } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      const room = await assertRoomAvailable(roomId, checkInDate, checkOutDate, { client: tx });

      if (numAdults > room.capacityAdults || numChildren > room.capacityChildren) {
        throw AppError.badRequest(
          `Room capacity exceeded (max ${room.capacityAdults} adults, ${room.capacityChildren} children)`,
          'CAPACITY_EXCEEDED'
        );
      }

      const priceBreakdown = await calculateBookingPrice({
        roomId, checkInDate, checkOutDate, discountCode, client: tx,
      });

      const booking = await tx.booking.create({
        data: {
          bookingNumber: generateBookingNumber(),
          customerId,
          roomId,
          checkInDate,
          checkOutDate,
          nights: priceBreakdown.nights,
          numAdults,
          numChildren,
          status: 'PENDING',
          roomSubtotal: priceBreakdown.roomSubtotal,
          taxAmount: priceBreakdown.taxAmount,
          serviceChargeAmount: priceBreakdown.serviceChargeAmount,
          discountAmount: priceBreakdown.discountAmount,
          additionalChargesAmount: priceBreakdown.additionalChargesAmount,
          totalAmount: priceBreakdown.totalAmount,
          priceBreakdown,
          specialRequests,
          guests: { create: guests?.map((g) => ({ ...g })) || [] },
          statusHistory: { create: { toStatus: 'PENDING', changedByUserId: customerId, reason: 'Booking created' } },
        },
        include: { guests: true, room: { include: { roomType: true } } },
      });

      // Soft-hold the room so it stops surfacing as available while payment
      // is pending. A background job releases stale PENDING holds.
      await tx.room.update({ where: { id: roomId }, data: { status: 'RESERVED' } });

      return booking;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000 });
  } catch (err) {
    if (err.code === 'P2034') {
      // Postgres serialization failure — another transaction won the race.
      throw AppError.conflict('This room was just booked by someone else for those dates. Please choose another room or date.', 'ROOM_ALREADY_BOOKED');
    }
    throw err;
  }
}

async function getBookingById(id, requester) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      guests: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      payments: { include: { transactions: true, refunds: true } },
      room: { include: { roomType: true } },
      customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      review: true,
    },
  });

  if (!booking) throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');

  if (requester && requester.role === 'CUSTOMER' && booking.customerId !== requester.id) {
    throw AppError.forbidden('You do not have access to this booking', 'FORBIDDEN_OWNERSHIP');
  }

  return booking;
}

async function listMyBookings(customerId, { page = 1, limit = 20, status } = {}) {
  const where = { customerId, ...(status && { status }) };
  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      include: { room: { include: { roomType: true } } },
    }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function listBookings({ page, limit, status, from, to, customerId, roomId }) {
  const where = {
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(roomId && { roomId }),
    ...((from || to) && {
      checkInDate: { ...(from && { gte: from }), ...(to && { lte: to }) },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        room: { include: { roomType: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/** Called by the payment service once a payment has been verified as CAPTURED. */
async function confirmBooking(bookingId, tx) {
  const db = tx || prisma;
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
  if (booking.status !== 'PENDING') {
    throw AppError.conflict(`Cannot confirm a booking in status ${booking.status}`, 'INVALID_STATUS_TRANSITION');
  }

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      statusHistory: { create: { fromStatus: 'PENDING', toStatus: 'CONFIRMED', reason: 'Payment captured' } },
    },
  });

  await db.room.update({ where: { id: booking.roomId }, data: { status: 'RESERVED' } });

  await notificationService.notify({
    userId: booking.customerId,
    type: 'BOOKING_CONFIRMATION',
    title: 'Booking confirmed',
    message: `Your reservation ${booking.bookingNumber} is confirmed. The family looks forward to your stay.`,
    channel: 'SOCKET',
    data: { bookingId: booking.id },
  }).catch((err) => logger.warn(`Booking confirmation notification failed: ${err.message}`));

  return updated;
}

async function assertCancellationEligible(booking) {
  if (!ACTIVE_STATUSES.includes(booking.status)) {
    throw AppError.conflict(`Booking in status ${booking.status} cannot be cancelled`, 'NOT_CANCELLABLE');
  }
  if (booking.status === 'CHECKED_IN') {
    throw AppError.conflict('An in-progress stay cannot be cancelled — please contact the front desk', 'NOT_CANCELLABLE');
  }

  const policyHours = await settingsService.getSettingValue('cancellationWindowHours', 24);
  const hoursUntilCheckIn = (new Date(booking.checkInDate) - new Date()) / (1000 * 60 * 60);

  return { withinFreeWindow: hoursUntilCheckIn >= policyHours, policyHours, hoursUntilCheckIn };
}

async function cancelBooking(bookingId, requester, reason) {
  const booking = await getBookingById(bookingId, requester);
  const eligibility = await assertCancellationEligible(booking);

  const paymentService = require('./payment.service'); // lazy require to avoid a cycle

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        statusHistory: {
          create: {
            fromStatus: booking.status, toStatus: 'CANCELLED',
            changedByUserId: requester.id, reason: reason || 'Cancelled by request',
          },
        },
      },
    });

    await tx.room.update({
      where: { id: booking.roomId },
      data: { status: 'AVAILABLE' },
    });

    return b;
  });

  // Refund outside the main transaction — it calls an external provider.
  await paymentService.refundForCancelledBooking(bookingId, { fullRefund: eligibility.withinFreeWindow })
    .catch((err) => logger.warn(`Refund initiation failed for ${bookingId}: ${err.message}`));

  await notificationService.notify({
    userId: booking.customerId,
    type: 'CANCELLATION',
    title: 'Booking cancelled',
    message: `Your reservation ${booking.bookingNumber} has been cancelled.`,
    channel: 'SOCKET',
    data: { bookingId },
  }).catch((err) => logger.warn(`Cancellation notification failed: ${err.message}`));

  return updated;
}

/** Releases stale PENDING bookings (no payment within the hold window) — used by a cron job. */
async function releaseExpiredHolds(holdMinutes = 20) {
  const cutoff = new Date(Date.now() - holdMinutes * 60 * 1000);
  const stale = await prisma.booking.findMany({
    where: { status: 'PENDING', createdAt: { lt: cutoff } },
    select: { id: true, roomId: true, bookingNumber: true, customerId: true },
  });

  for (const b of stale) {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: b.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: 'Payment hold expired',
          statusHistory: { create: { fromStatus: 'PENDING', toStatus: 'CANCELLED', reason: 'Payment hold expired' } },
        },
      }),
      prisma.room.update({ where: { id: b.roomId }, data: { status: 'AVAILABLE' } }),
    ]);
  }

  return stale.length;
}

module.exports = {
  createBooking,
  getBookingById,
  listMyBookings,
  listBookings,
  confirmBooking,
  cancelBooking,
  assertCancellationEligible,
  releaseExpiredHolds,
  ACTIVE_STATUSES,
};

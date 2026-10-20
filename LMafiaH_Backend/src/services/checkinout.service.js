const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

/**
 * Booking status and room status are kept synchronized on every transition:
 *   CONFIRMED --checkIn--> CHECKED_IN     room: RESERVED  -> OCCUPIED
 *   CHECKED_IN --checkOut--> CHECKED_OUT  room: OCCUPIED  -> CLEANING
 * All transitions are validated server-side regardless of what the client sends.
 */
async function checkIn(bookingId, staffUserId) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { room: true } });
  if (!booking) throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');

  if (booking.status !== 'CONFIRMED') {
    throw AppError.conflict(`Cannot check in a booking with status ${booking.status}`, 'INVALID_STATUS_TRANSITION');
  }

  const today = new Date(new Date().toDateString());
  if (new Date(booking.checkInDate) > today) {
    throw AppError.badRequest('Check-in date has not arrived yet', 'CHECKIN_TOO_EARLY');
  }

  const [updatedBooking] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_IN',
        actualCheckInAt: new Date(),
        statusHistory: {
          create: { fromStatus: 'CONFIRMED', toStatus: 'CHECKED_IN', changedByUserId: staffUserId, reason: 'Guest checked in' },
        },
      },
      include: { room: true, customer: true },
    }),
    prisma.room.update({ where: { id: booking.roomId }, data: { status: 'OCCUPIED' } }),
  ]);

  await notificationService.notify({
    userId: booking.customerId,
    type: 'GENERAL',
    title: 'Checked in',
    message: `Welcome. You are checked in to room ${booking.room.roomNumber}. Enjoy your stay.`,
    channel: 'SOCKET',
    data: { bookingId },
  }).catch((err) => logger.warn(`Check-in notification failed: ${err.message}`));

  return updatedBooking;
}

async function checkOut(bookingId, staffUserId) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { room: true } });
  if (!booking) throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');

  if (booking.status !== 'CHECKED_IN') {
    throw AppError.conflict(`Cannot check out a booking with status ${booking.status}`, 'INVALID_STATUS_TRANSITION');
  }

  const [updatedBooking] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_OUT',
        actualCheckOutAt: new Date(),
        statusHistory: {
          create: { fromStatus: 'CHECKED_IN', toStatus: 'CHECKED_OUT', changedByUserId: staffUserId, reason: 'Guest checked out' },
        },
      },
      include: { room: true, customer: true },
    }),
    // Room goes to CLEANING, not straight back to AVAILABLE — housekeeping
    // must explicitly mark it AVAILABLE again via updateRoomStatus.
    prisma.room.update({ where: { id: booking.roomId }, data: { status: 'CLEANING' } }),
    prisma.staffTask.create({
      data: {
        createdById: staffUserId,
        type: 'HOUSEKEEPING',
        title: `Turn down room ${booking.room.roomNumber}`,
        description: `Guest checked out of booking ${booking.bookingNumber}. Room needs cleaning before it can be marked available.`,
        roomId: booking.roomId,
        bookingId: booking.id,
        priority: 'MEDIUM',
      },
    }),
  ]);

  await notificationService.notify({
    userId: booking.customerId,
    type: 'GENERAL',
    title: 'Checked out',
    message: `Thank you for staying with us, ${booking.bookingNumber}. Arrivederci.`,
    channel: 'SOCKET',
    data: { bookingId },
  }).catch((err) => logger.warn(`Check-out notification failed: ${err.message}`));

  return updatedBooking;
}

async function todaysCheckIns() {
  const start = new Date(new Date().toDateString());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return prisma.booking.findMany({
    where: { status: 'CONFIRMED', checkInDate: { gte: start, lt: end } },
    include: { room: true, customer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    orderBy: { checkInDate: 'asc' },
  });
}

async function todaysCheckOuts() {
  const start = new Date(new Date().toDateString());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return prisma.booking.findMany({
    where: { status: 'CHECKED_IN', checkOutDate: { gte: start, lt: end } },
    include: { room: true, customer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    orderBy: { checkOutDate: 'asc' },
  });
}

module.exports = { checkIn, checkOut, todaysCheckIns, todaysCheckOuts };

const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const env = require('../config/env');

function nightsBetween(checkInDate, checkOutDate) {
  const msPerNight = 24 * 60 * 60 * 1000;
  return Math.round((new Date(checkOutDate) - new Date(checkInDate)) / msPerNight);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Simple pluggable discount rules. In production these would live in the DB
 * (a Promotion/Coupon table) — kept in-code here to avoid an unrequested table,
 * but isolated behind one function so it's a one-line change to swap in a DB lookup.
 */
function resolveDiscountPercent(discountCode, nights) {
  if (!discountCode) return 0;
  const code = discountCode.trim().toUpperCase();
  if (code === 'CONSIGLIERE10') return 10;
  if (code === 'OMERTA20' && nights >= 5) return 20; // loyalty-style long-stay offer
  return 0;
}

/**
 * The backend is the sole source of truth for price. The frontend may show an
 * estimate, but every booking/payment is computed here from the room's
 * authoritative price at the time of the call — a client-supplied "total" is
 * never accepted anywhere in the booking flow.
 */
async function calculateBookingPrice({ roomId, checkInDate, checkOutDate, discountCode, client }) {
  const db = client || prisma;
  const room = await db.room.findUnique({ where: { id: roomId }, include: { roomType: true } });

  if (!room || !room.isActive) {
    throw AppError.notFound('Room not found or inactive', 'ROOM_NOT_FOUND');
  }

  const nights = nightsBetween(checkInDate, checkOutDate);
  if (nights < 1) {
    throw AppError.badRequest('Booking must span at least one night', 'INVALID_DATE_RANGE');
  }

  const nightlyRate = Number(room.price ?? room.roomType.basePrice);
  const roomSubtotal = round2(nightlyRate * nights);

  const discountPercent = resolveDiscountPercent(discountCode, nights);
  const discountAmount = round2(roomSubtotal * (discountPercent / 100));

  const discountedSubtotal = round2(roomSubtotal - discountAmount);
  const taxAmount = round2(discountedSubtotal * (env.pricing.taxRatePercent / 100));
  const serviceChargeAmount = round2(discountedSubtotal * (env.pricing.serviceChargePercent / 100));
  const additionalChargesAmount = 0;

  const totalAmount = round2(
    discountedSubtotal + taxAmount + serviceChargeAmount + additionalChargesAmount
  );

  return {
    roomId: room.id,
    roomNumber: room.roomNumber,
    nightlyRate,
    nights,
    roomSubtotal,
    discountCode: discountCode || null,
    discountPercent,
    discountAmount,
    taxRatePercent: env.pricing.taxRatePercent,
    taxAmount,
    serviceChargePercent: env.pricing.serviceChargePercent,
    serviceChargeAmount,
    additionalChargesAmount,
    totalAmount,
    currency: 'INR',
    calculatedAt: new Date().toISOString(),
  };
}

module.exports = { calculateBookingPrice, nightsBetween, round2 };

const prisma = require('../config/database');

/**
 * A booking occupies [checkInDate, checkOutDate) — checkout day is free for a
 * new check-in. Two date ranges overlap iff existingStart < newEnd AND
 * existingEnd > newStart. Only PENDING/CONFIRMED/CHECKED_IN bookings block a
 * room; CANCELLED and CHECKED_OUT never do.
 */
const BLOCKING_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];

/**
 * Returns true if `roomId` has any blocking booking overlapping the given
 * range. `excludeBookingId` lets callers re-check a booking being modified.
 * Accepts an optional Prisma transaction client so this can run inside the
 * same transaction as the booking insert (required to actually prevent
 * double-booking under concurrency).
 */
async function isRoomBooked(roomId, checkInDate, checkOutDate, { excludeBookingId, client } = {}) {
  const db = client || prisma;

  const conflict = await db.booking.findFirst({
    where: {
      roomId,
      status: { in: BLOCKING_STATUSES },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      checkInDate: { lt: checkOutDate },
      checkOutDate: { gt: checkInDate },
    },
    select: { id: true },
  });

  return Boolean(conflict);
}

/**
 * Finds every room (optionally filtered by type/capacity) that is:
 *  - active and not under MAINTENANCE
 *  - free of any overlapping blocking booking for the requested date range
 */
async function findAvailableRooms({ checkInDate, checkOutDate, adults = 1, children = 0, roomTypeId }) {
  const candidateRooms = await prisma.room.findMany({
    where: {
      isActive: true,
      status: { not: 'MAINTENANCE' },
      ...(roomTypeId && { roomTypeId }),
      capacityAdults: { gte: adults },
      capacityChildren: { gte: children },
    },
    include: { roomType: true, amenities: { include: { amenity: true } } },
  });

  if (candidateRooms.length === 0) return [];

  const overlapping = await prisma.booking.findMany({
    where: {
      roomId: { in: candidateRooms.map((r) => r.id) },
      status: { in: BLOCKING_STATUSES },
      checkInDate: { lt: checkOutDate },
      checkOutDate: { gt: checkInDate },
    },
    select: { roomId: true },
  });

  const bookedRoomIds = new Set(overlapping.map((b) => b.roomId));
  return candidateRooms.filter((r) => !bookedRoomIds.has(r.id));
}

async function assertRoomAvailable(roomId, checkInDate, checkOutDate, opts = {}) {
  const AppError = require('../utils/AppError');
  const room = await (opts.client || prisma).room.findUnique({ where: { id: roomId } });

  if (!room || !room.isActive) {
    throw AppError.notFound('Room not found or inactive', 'ROOM_NOT_FOUND');
  }
  if (room.status === 'MAINTENANCE') {
    throw AppError.conflict('Room is currently under maintenance', 'ROOM_UNAVAILABLE');
  }

  const booked = await isRoomBooked(roomId, checkInDate, checkOutDate, opts);
  if (booked) {
    throw AppError.conflict('Room is not available for the selected dates', 'ROOM_ALREADY_BOOKED');
  }

  return room;
}

module.exports = { isRoomBooked, findAvailableRooms, assertRoomAvailable, BLOCKING_STATUSES };

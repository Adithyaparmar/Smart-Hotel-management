const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { findAvailableRooms } = require('./availability.service');

async function createRoom(data) {
  const { amenityIds, ...roomData } = data;

  const existing = await prisma.room.findUnique({ where: { roomNumber: roomData.roomNumber } });
  if (existing) throw AppError.conflict('A room with this room number already exists', 'ROOM_NUMBER_TAKEN');

  return prisma.room.create({
    data: {
      ...roomData,
      ...(amenityIds && amenityIds.length > 0 && {
        amenities: { create: amenityIds.map((amenityId) => ({ amenityId })) },
      }),
    },
    include: { roomType: true, amenities: { include: { amenity: true } } },
  });
}

async function updateRoom(id, data) {
  const { amenityIds, ...roomData } = data;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw AppError.notFound('Room not found', 'ROOM_NOT_FOUND');

  return prisma.$transaction(async (tx) => {
    if (amenityIds) {
      await tx.roomAmenity.deleteMany({ where: { roomId: id } });
      if (amenityIds.length > 0) {
        await tx.roomAmenity.createMany({ data: amenityIds.map((amenityId) => ({ roomId: id, amenityId })) });
      }
    }
    return tx.room.update({
      where: { id },
      data: roomData,
      include: { roomType: true, amenities: { include: { amenity: true } } },
    });
  });
}

async function deactivateRoom(id) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw AppError.notFound('Room not found', 'ROOM_NOT_FOUND');
  return prisma.room.update({ where: { id }, data: { isActive: false, status: 'MAINTENANCE' } });
}

async function getRoom(id) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      roomType: true,
      amenities: { include: { amenity: true } },
      reviews: {
        where: { isPublished: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  if (!room) throw AppError.notFound('Room not found', 'ROOM_NOT_FOUND');
  return room;
}

async function listRooms(query) {
  const {
    page, limit, sortBy, sortOrder, status, roomTypeId, bedType, viewType,
    minPrice, maxPrice, minCapacity, search, isActive,
  } = query;

  const where = {
    ...(status && { status }),
    ...(roomTypeId && { roomTypeId }),
    ...(bedType && { bedType }),
    ...(viewType && { viewType }),
    ...(isActive !== undefined && { isActive }),
    ...(minCapacity && { capacityAdults: { gte: minCapacity } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  // Price filters apply to the room override price OR its room type's base price.
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.OR = [
      ...(where.OR || []),
      {
        AND: [
          { price: { not: null } },
          { price: { gte: minPrice ?? 0, lte: maxPrice ?? 999999 } },
        ],
      },
      {
        AND: [
          { price: null },
          { roomType: { basePrice: { gte: minPrice ?? 0, lte: maxPrice ?? 999999 } } },
        ],
      },
    ];
  }

  const orderBy = sortBy === 'price' ? { price: sortOrder } : { [sortBy]: sortOrder };

  const [items, total] = await prisma.$transaction([
    prisma.room.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy,
      include: { roomType: true, amenities: { include: { amenity: true } } },
    }),
    prisma.room.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function searchAvailability(params) {
  return findAvailableRooms(params);
}

async function updateRoomStatus(id, status, actorUserId, reason) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw AppError.notFound('Room not found', 'ROOM_NOT_FOUND');

  return prisma.room.update({ where: { id }, data: { status } });
}

module.exports = {
  createRoom, updateRoom, deactivateRoom, getRoom, listRooms, searchAvailability, updateRoomStatus,
};

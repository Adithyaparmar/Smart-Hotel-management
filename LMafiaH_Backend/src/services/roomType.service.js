const prisma = require('../config/database');
const AppError = require('../utils/AppError');

async function createRoomType(data) {
  const existing = await prisma.roomType.findUnique({ where: { name: data.name } });
  if (existing) throw AppError.conflict('A room type with this name already exists', 'ROOM_TYPE_EXISTS');
  return prisma.roomType.create({ data });
}

async function updateRoomType(id, data) {
  const rt = await prisma.roomType.findUnique({ where: { id } });
  if (!rt) throw AppError.notFound('Room type not found', 'ROOM_TYPE_NOT_FOUND');
  return prisma.roomType.update({ where: { id }, data });
}

async function listRoomTypes() {
  return prisma.roomType.findMany({ where: { isActive: true }, orderBy: { basePrice: 'asc' } });
}

async function getRoomType(id) {
  const rt = await prisma.roomType.findUnique({ where: { id }, include: { rooms: { select: { id: true, roomNumber: true, status: true } } } });
  if (!rt) throw AppError.notFound('Room type not found', 'ROOM_TYPE_NOT_FOUND');
  return rt;
}

async function deactivateRoomType(id) {
  const rt = await prisma.roomType.findUnique({ where: { id } });
  if (!rt) throw AppError.notFound('Room type not found', 'ROOM_TYPE_NOT_FOUND');
  return prisma.roomType.update({ where: { id }, data: { isActive: false } });
}

module.exports = { createRoomType, updateRoomType, listRoomTypes, getRoomType, deactivateRoomType };

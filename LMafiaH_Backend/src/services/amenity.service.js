const prisma = require('../config/database');
const AppError = require('../utils/AppError');

async function createAmenity(data) {
  const existing = await prisma.amenity.findUnique({ where: { name: data.name } });
  if (existing) throw AppError.conflict('An amenity with this name already exists', 'AMENITY_EXISTS');
  return prisma.amenity.create({ data });
}

async function updateAmenity(id, data) {
  const amenity = await prisma.amenity.findUnique({ where: { id } });
  if (!amenity) throw AppError.notFound('Amenity not found', 'AMENITY_NOT_FOUND');
  return prisma.amenity.update({ where: { id }, data });
}

async function listAmenities({ category } = {}) {
  return prisma.amenity.findMany({ where: { ...(category && { category }) }, orderBy: { name: 'asc' } });
}

async function deleteAmenity(id) {
  const amenity = await prisma.amenity.findUnique({ where: { id } });
  if (!amenity) throw AppError.notFound('Amenity not found', 'AMENITY_NOT_FOUND');
  await prisma.amenity.delete({ where: { id } });
}

module.exports = { createAmenity, updateAmenity, listAmenities, deleteAmenity };

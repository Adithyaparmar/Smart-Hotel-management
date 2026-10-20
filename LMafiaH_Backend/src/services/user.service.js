const prisma = require('../config/database');
const AppError = require('../utils/AppError');

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customerProfile: true, staffProfile: true },
  });
  if (!user) throw AppError.notFound('User not found');

  const { passwordHash, ...safe } = user;
  return safe;
}

async function updateProfile(userId, updates) {
  const {
    firstName, lastName, phone, preferredView, preferredBed, address, city, country,
  } = updates;

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
      },
    }),
    prisma.customerProfile.upsert({
      where: { userId },
      update: {
        ...(preferredView !== undefined && { preferredView }),
        ...(preferredBed !== undefined && { preferredBed }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
      },
      create: {
        userId, preferredView, preferredBed, address, city, country,
      },
    }),
  ]);

  return getProfile(user.id);
}

async function listUsers({ page = 1, limit = 20, role, search } = {}) {
  const where = {
    ...(role && { role }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true, lastLoginAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function setUserActive(userId, isActive, actorRole) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw AppError.notFound('User not found');

  if (target.role === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
    throw AppError.forbidden('Only a SUPER_ADMIN can modify another SUPER_ADMIN account');
  }

  return prisma.user.update({ where: { id: userId }, data: { isActive } });
}

module.exports = { getProfile, updateProfile, listUsers, setUserActive };

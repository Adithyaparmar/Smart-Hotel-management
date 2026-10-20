const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');

async function createStaff({ email, phone, password, firstName, lastName, role, department, position, shift }) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, phone ? { phone } : undefined].filter(Boolean) } });
  if (existing) throw AppError.conflict('An account with this email or phone already exists', 'ACCOUNT_EXISTS');

  const passwordHash = await hashPassword(password);
  const employeeCode = `LMH-${department.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, phone, passwordHash, firstName, lastName, role, isEmailVerified: true },
    });
    const staffProfile = await tx.staffProfile.create({
      data: { userId: user.id, employeeCode, department, position, shift },
    });
    return { ...user, staffProfile };
  });
}

async function listStaff({ page = 1, limit = 20, department } = {}) {
  const where = { role: { in: ['STAFF', 'ADMIN'] }, ...(department && { staffProfile: { department } }) };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      include: { staffProfile: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function createTask(createdById, data) {
  return prisma.staffTask.create({ data: { ...data, createdById } });
}

async function updateTask(taskId, updates) {
  const task = await prisma.staffTask.findUnique({ where: { id: taskId } });
  if (!task) throw AppError.notFound('Task not found', 'TASK_NOT_FOUND');

  return prisma.staffTask.update({
    where: { id: taskId },
    data: {
      ...updates,
      ...(updates.status === 'COMPLETED' && { completedAt: new Date() }),
    },
  });
}

async function listTasks({ page = 1, limit = 20, assignedToId, status } = {}) {
  const where = { ...(assignedToId && { assignedToId }), ...(status && { status }) };
  const [items, total] = await prisma.$transaction([
    prisma.staffTask.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      include: { room: true, booking: { select: { bookingNumber: true } }, assignedTo: { select: { firstName: true, lastName: true } } },
    }),
    prisma.staffTask.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function staffDashboard() {
  const { todaysCheckIns, todaysCheckOuts } = require('./checkinout.service');
  const [checkIns, checkOuts, openTasks, roomsByStatus] = await Promise.all([
    todaysCheckIns(),
    todaysCheckOuts(),
    prisma.staffTask.findMany({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } }, orderBy: { priority: 'desc' }, take: 20 }),
    prisma.room.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  return {
    todaysCheckIns: checkIns,
    todaysCheckOuts: checkOuts,
    openTasks,
    roomsByStatus: Object.fromEntries(roomsByStatus.map((r) => [r.status, r._count.status])),
  };
}

module.exports = { createStaff, listStaff, createTask, updateTask, listTasks, staffDashboard };

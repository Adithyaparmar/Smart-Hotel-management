const prisma = require('../config/database');

let ioRef = null;
/** Called once by sockets/index.js after Socket.IO is initialized. */
function attachSocketServer(io) {
  ioRef = io;
}

/**
 * Creates a persisted notification and, when the channel is SOCKET (or the
 * user has an active socket connection), pushes it in real time to that
 * user's private room (`user:<id>`), joined on socket auth.
 */
async function notify({ userId, type, title, message, data, channel = 'IN_APP' }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, data, channel },
  });

  if (ioRef && (channel === 'SOCKET' || channel === 'IN_APP')) {
    ioRef.to(`user:${userId}`).emit('notification', notification);
  }

  return notification;
}

async function notifyRole(role, payload) {
  const users = await prisma.user.findMany({ where: { role, isActive: true }, select: { id: true } });
  return Promise.all(users.map((u) => notify({ ...payload, userId: u.id })));
}

async function listForUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const where = { userId, ...(unreadOnly && { isRead: false }) };
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount };
}

async function markRead(userId, notificationId) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

module.exports = { attachSocketServer, notify, notifyRole, listForUser, markRead, markAllRead };

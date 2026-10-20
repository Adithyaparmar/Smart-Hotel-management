const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');
const prisma = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');
const registerRoomEvents = require('./room.events');
const registerBookingEvents = require('./booking.events');

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Auth handshake: the client sends its JWT access token; we resolve it to
  // a real user the same way the REST `authenticate` middleware does.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) return next(new Error('Invalid session'));

      socket.user = { id: user.id, role: user.role, firstName: user.firstName };
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (user ${socket.user.id})`);

    // Every user gets a private room for direct notifications.
    socket.join(`user:${socket.user.id}`);
    // Staff/admin join role rooms for operational broadcasts (room status, alerts).
    if (['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(socket.user.role)) {
      socket.join('staff-and-admin');
    }
    if (['ADMIN', 'SUPER_ADMIN'].includes(socket.user.role)) {
      socket.join('admin');
    }

    registerRoomEvents(io, socket);
    registerBookingEvents(io, socket);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  notificationService.attachSocketServer(io);
  return io;
}

module.exports = initSockets;

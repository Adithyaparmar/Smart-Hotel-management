/**
 * Broadcasts a room status change to every connected staff/admin dashboard.
 * Called by room.service.updateRoomStatus (via the emitter below) whenever
 * housekeeping/maintenance/front-desk changes a room's operational status.
 */
let ioSingleton = null;

function registerRoomEvents(io) {
  ioSingleton = io;
}

function emitRoomStatusChanged(room) {
  if (!ioSingleton) return;
  ioSingleton.to('staff-and-admin').emit('room:status_changed', {
    roomId: room.id, roomNumber: room.roomNumber, status: room.status,
  });
}

module.exports = registerRoomEvents;
module.exports.emitRoomStatusChanged = emitRoomStatusChanged;

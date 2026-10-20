/**
 * Broadcasts booking lifecycle changes to staff/admin dashboards in real
 * time (new booking, cancellation, check-in, check-out) so operational
 * screens never need to poll.
 */
let ioSingleton = null;

function registerBookingEvents(io) {
  ioSingleton = io;
}

function emitBookingUpdated(booking, event = 'booking:updated') {
  if (!ioSingleton) return;
  ioSingleton.to('staff-and-admin').emit(event, {
    bookingId: booking.id, bookingNumber: booking.bookingNumber, status: booking.status,
  });
}

module.exports = registerBookingEvents;
module.exports.emitBookingUpdated = emitBookingUpdated;

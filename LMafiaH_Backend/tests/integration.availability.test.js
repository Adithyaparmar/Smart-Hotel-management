describe('availability.service — overlap detection', () => {
  let isRoomBooked;
  let bookingFindFirstMock;

  beforeEach(() => {
    jest.resetModules();
    bookingFindFirstMock = jest.fn();
    jest.doMock('../src/config/database', () => ({
      booking: { findFirst: bookingFindFirstMock },
    }));
    // eslint-disable-next-line global-require
    ({ isRoomBooked } = require('../src/services/availability.service'));
  });

  test('queries only PENDING/CONFIRMED/CHECKED_IN bookings as blocking', async () => {
    bookingFindFirstMock.mockResolvedValue(null);
    await isRoomBooked('room-1', new Date('2026-10-01'), new Date('2026-10-05'));

    const whereArg = bookingFindFirstMock.mock.calls[0][0].where;
    expect(whereArg.status.in).toEqual(['PENDING', 'CONFIRMED', 'CHECKED_IN']);
    expect(whereArg.roomId).toBe('room-1');
  });

  test('returns true when an overlapping blocking booking exists', async () => {
    bookingFindFirstMock.mockResolvedValue({ id: 'existing-booking' });
    const result = await isRoomBooked('room-1', new Date('2026-10-01'), new Date('2026-10-05'));
    expect(result).toBe(true);
  });

  test('returns false when no overlapping booking exists', async () => {
    bookingFindFirstMock.mockResolvedValue(null);
    const result = await isRoomBooked('room-1', new Date('2026-10-01'), new Date('2026-10-05'));
    expect(result).toBe(false);
  });

  test('excludes a given bookingId from the overlap check (used when re-validating an existing booking)', async () => {
    bookingFindFirstMock.mockResolvedValue(null);
    await isRoomBooked('room-1', new Date('2026-10-01'), new Date('2026-10-05'), { excludeBookingId: 'booking-9' });
    const whereArg = bookingFindFirstMock.mock.calls[0][0].where;
    expect(whereArg.id).toEqual({ not: 'booking-9' });
  });

  test('uses the half-open range convention: checkout day itself does not block a new check-in', async () => {
    // A stay 2026-10-01 -> 2026-10-05 should NOT block a new booking for 2026-10-05 -> 2026-10-08.
    bookingFindFirstMock.mockResolvedValue(null);
    await isRoomBooked('room-1', new Date('2026-10-05'), new Date('2026-10-08'));
    const whereArg = bookingFindFirstMock.mock.calls[0][0].where;
    // checkInDate: { lt: checkOutDate } and checkOutDate: { gt: checkInDate } is the overlap predicate;
    // for a booking ending exactly on the new check-in date, existingEnd > newStart is false, so it's excluded.
    expect(whereArg.checkInDate.lt).toEqual(new Date('2026-10-08'));
    expect(whereArg.checkOutDate.gt).toEqual(new Date('2026-10-05'));
  });
});

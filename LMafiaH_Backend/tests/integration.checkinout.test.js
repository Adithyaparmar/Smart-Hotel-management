describe('checkinout.service — state transition validation', () => {
  let checkIn;
  let checkOut;
  let prismaMock;

  beforeEach(() => {
    jest.resetModules();
    prismaMock = {
      booking: { findUnique: jest.fn(), update: jest.fn() },
      room: { update: jest.fn() },
      staffTask: { create: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops.map((op) => (typeof op === 'function' ? op() : op)))),
    };
    jest.doMock('../src/config/database', () => prismaMock);
    jest.doMock('../src/services/notification.service', () => ({ notify: jest.fn().mockResolvedValue({}) }));
    // eslint-disable-next-line global-require
    ({ checkIn, checkOut } = require('../src/services/checkinout.service'));
  });

  test('checkIn succeeds from CONFIRMED and flips booking->CHECKED_IN, room->OCCUPIED', async () => {
    const today = new Date();
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'b1', status: 'CONFIRMED', roomId: 'room-1', checkInDate: today, room: { roomNumber: '501' },
    });
    prismaMock.$transaction.mockImplementation((ops) => Promise.all(ops));
    prismaMock.booking.update.mockResolvedValue({ id: 'b1', status: 'CHECKED_IN', room: { roomNumber: '501' }, customer: {} });

    await checkIn('b1', 'staff-1');
    expect(prismaMock.booking.update).toHaveBeenCalled();
    const updateArg = prismaMock.booking.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe('CHECKED_IN');
  });

  test('checkIn rejects a booking that is not CONFIRMED (e.g. still PENDING)', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'PENDING', roomId: 'room-1', checkInDate: new Date() });
    await expect(checkIn('b1', 'staff-1')).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  });

  test('checkIn rejects when the check-in date has not arrived yet', async () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    prismaMock.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'CONFIRMED', roomId: 'room-1', checkInDate: future });
    await expect(checkIn('b1', 'staff-1')).rejects.toMatchObject({ code: 'CHECKIN_TOO_EARLY' });
  });

  test('checkOut rejects a booking that is not CHECKED_IN', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'CONFIRMED', roomId: 'room-1' });
    await expect(checkOut('b1', 'staff-1')).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
  });

  test('checkOut succeeds from CHECKED_IN and moves the room to CLEANING (not straight to AVAILABLE)', async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'b1', status: 'CHECKED_IN', roomId: 'room-1', bookingNumber: 'LMH-2026-000001', room: { roomNumber: '501' },
    });
    prismaMock.$transaction.mockImplementation((ops) => Promise.all(ops));
    prismaMock.booking.update.mockResolvedValue({ id: 'b1', status: 'CHECKED_OUT', room: { roomNumber: '501' }, customer: {} });
    prismaMock.room.update.mockResolvedValue({ id: 'room-1', status: 'CLEANING' });

    await checkOut('b1', 'staff-1');
    expect(prismaMock.room.update).toHaveBeenCalledWith({ where: { id: 'room-1' }, data: { status: 'CLEANING' } });
    expect(prismaMock.staffTask.create).toHaveBeenCalled();
  });
});

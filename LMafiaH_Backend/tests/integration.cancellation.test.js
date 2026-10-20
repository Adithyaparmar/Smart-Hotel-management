describe('booking.service.cancelBooking — eligibility & side effects', () => {
  let cancelBooking;
  let prismaMock;
  let refundMock;

  function futureBooking(hoursFromNow, status = 'CONFIRMED') {
    return {
      id: 'b1', bookingNumber: 'LMH-2026-000001', status, roomId: 'room-1', customerId: 'cust-1',
      checkInDate: new Date(Date.now() + hoursFromNow * 60 * 60 * 1000),
    };
  }

  beforeEach(() => {
    jest.resetModules();
    prismaMock = {
      booking: { findUnique: jest.fn(), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'b1', ...data })) },
      room: { update: jest.fn().mockResolvedValue({}) },
      hotelSetting: { findUnique: jest.fn().mockResolvedValue(null) }, // falls back to DEFAULTS (24h window)
      $transaction: jest.fn((fn) => fn(prismaMock)),
    };
    refundMock = jest.fn().mockResolvedValue({});

    jest.doMock('../src/config/database', () => prismaMock);
    jest.doMock('../src/services/notification.service', () => ({ notify: jest.fn().mockResolvedValue({}) }));
    jest.doMock('../src/services/payment.service', () => ({ refundForCancelledBooking: refundMock }));

    // eslint-disable-next-line global-require
    ({ cancelBooking } = require('../src/services/booking.service'));
  });

  test('cancels a CONFIRMED booking well outside the cancellation window and issues a full refund', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(futureBooking(72)); // 3 days out

    const result = await cancelBooking('b1', { id: 'cust-1', role: 'CUSTOMER' }, 'Change of plans');

    expect(result.status).toBe('CANCELLED');
    expect(prismaMock.room.update).toHaveBeenCalledWith({ where: { id: 'room-1' }, data: { status: 'AVAILABLE' } });
    expect(refundMock).toHaveBeenCalledWith('b1', { fullRefund: true });
  });

  test('cancels within the free window but flags a partial (late-cancellation) refund', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(futureBooking(2)); // 2 hours out, window is 24h
    await cancelBooking('b1', { id: 'cust-1', role: 'CUSTOMER' }, 'Emergency');
    expect(refundMock).toHaveBeenCalledWith('b1', { fullRefund: false });
  });

  test('refuses to cancel a booking that is already CHECKED_IN', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(futureBooking(-5, 'CHECKED_IN'));
    await expect(cancelBooking('b1', { id: 'cust-1', role: 'CUSTOMER' }))
      .rejects.toMatchObject({ code: 'NOT_CANCELLABLE' });
  });

  test('refuses to cancel a booking that is already CANCELLED or CHECKED_OUT', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(futureBooking(72, 'CHECKED_OUT'));
    await expect(cancelBooking('b1', { id: 'cust-1', role: 'CUSTOMER' }))
      .rejects.toMatchObject({ code: 'NOT_CANCELLABLE' });
  });

  test('a customer cannot cancel someone else\'s booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(futureBooking(72));
    await expect(cancelBooking('b1', { id: 'someone-else', role: 'CUSTOMER' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN_OWNERSHIP' });
  });
});

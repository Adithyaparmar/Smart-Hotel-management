const { round2 } = require('../src/services/pricing.service');

describe('pricing.service — pure math helpers', () => {
  test('round2 rounds to 2 decimal places without float drift', () => {
    expect(round2(100.005)).toBeCloseTo(100.01, 2);
    expect(round2(99.999)).toBeCloseTo(100.0, 2);
    expect(round2(0.1 + 0.2)).toBeCloseTo(0.3, 2);
  });
});

describe('pricing.service — calculateBookingPrice (mocked Prisma)', () => {
  let calculateBookingPrice;
  const mockRoom = {
    id: 'room-1', isActive: true, price: 10000, roomType: { basePrice: 8000 },
  };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../src/config/database', () => ({
      room: { findUnique: jest.fn().mockResolvedValue(mockRoom) },
    }));
    // eslint-disable-next-line global-require
    ({ calculateBookingPrice } = require('../src/services/pricing.service'));
  });

  test('computes room subtotal, tax, service charge and total for a 3-night stay', async () => {
    const checkInDate = new Date('2026-09-01');
    const checkOutDate = new Date('2026-09-04'); // 3 nights

    const breakdown = await calculateBookingPrice({ roomId: 'room-1', checkInDate, checkOutDate });

    expect(breakdown.nights).toBe(3);
    expect(breakdown.nightlyRate).toBe(10000); // room-level override price wins over room type base price
    expect(breakdown.roomSubtotal).toBe(30000);
    expect(breakdown.taxAmount).toBeCloseTo(30000 * 0.12, 2);
    expect(breakdown.serviceChargeAmount).toBeCloseTo(30000 * 0.05, 2);
    expect(breakdown.totalAmount).toBeCloseTo(30000 + 30000 * 0.12 + 30000 * 0.05, 2);
    expect(breakdown.discountAmount).toBe(0);
  });

  test('applies a valid discount code before computing tax/service charge', async () => {
    const breakdown = await calculateBookingPrice({
      roomId: 'room-1', checkInDate: new Date('2026-09-01'), checkOutDate: new Date('2026-09-06'), discountCode: 'OMERTA20',
    });
    // 5 nights * 10000 = 50000, 20% off -> 40000 discounted subtotal
    expect(breakdown.nights).toBe(5);
    expect(breakdown.discountPercent).toBe(20);
    expect(breakdown.discountAmount).toBe(10000);
    expect(breakdown.taxAmount).toBeCloseTo(40000 * 0.12, 2);
  });

  test('rejects a same-day or inverted date range', async () => {
    await expect(calculateBookingPrice({
      roomId: 'room-1', checkInDate: new Date('2026-09-05'), checkOutDate: new Date('2026-09-05'),
    })).rejects.toThrow(/at least one night/i);
  });
});

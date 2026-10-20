describe('booking.service.createBooking — double-booking prevention', () => {
  let createBooking;
  let prismaMock;

  const room = { id: 'room-1', isActive: true, status: 'AVAILABLE', capacityAdults: 2, capacityChildren: 1, price: 10000, roomType: { basePrice: 8000 } };

  beforeEach(() => {
    jest.resetModules();

    const txClient = {
      room: {
        findUnique: jest.fn().mockResolvedValue(room),
        update: jest.fn().mockResolvedValue(room),
      },
      booking: {
        findFirst: jest.fn().mockResolvedValue(null), // no conflicting booking by default
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-booking-1', ...data })),
      },
    };

    prismaMock = {
      $transaction: jest.fn(async (fn) => fn(txClient)),
      __txClient: txClient,
    };

    jest.doMock('../src/config/database', () => prismaMock);
    jest.doMock('../src/services/notification.service', () => ({ notify: jest.fn().mockResolvedValue({}) }));
    jest.doMock('@prisma/client', () => ({
      Prisma: { TransactionIsolationLevel: { Serializable: 'Serializable' } },
    }));

    // eslint-disable-next-line global-require
    ({ createBooking } = require('../src/services/booking.service'));
  });

  test('creates a booking when the room is free for the requested dates', async () => {
    const result = await createBooking('customer-1', {
      roomId: 'room-1',
      checkInDate: new Date('2026-11-01'),
      checkOutDate: new Date('2026-11-04'),
      numAdults: 2, numChildren: 0, guests: [],
    });

    expect(result.status).toBe('PENDING');
    expect(prismaMock.__txClient.booking.create).toHaveBeenCalledTimes(1);
    // Room is soft-held (RESERVED) as soon as a PENDING booking is created.
    expect(prismaMock.__txClient.room.update).toHaveBeenCalledWith({ where: { id: 'room-1' }, data: { status: 'RESERVED' } });
  });

  test('rejects a booking when an overlapping booking already exists (checked inside the same transaction)', async () => {
    prismaMock.__txClient.booking.findFirst.mockResolvedValue({ id: 'conflicting-booking' });

    await expect(createBooking('customer-1', {
      roomId: 'room-1',
      checkInDate: new Date('2026-11-01'),
      checkOutDate: new Date('2026-11-04'),
      numAdults: 2, numChildren: 0, guests: [],
    })).rejects.toMatchObject({ code: 'ROOM_ALREADY_BOOKED', statusCode: 409 });

    expect(prismaMock.__txClient.booking.create).not.toHaveBeenCalled();
  });

  test('translates a Postgres serialization failure (P2034) from a concurrent transaction into a clean 409', async () => {
    prismaMock.$transaction = jest.fn().mockRejectedValue(Object.assign(new Error('could not serialize'), { code: 'P2034' }));
    jest.resetModules();
    jest.doMock('../src/config/database', () => prismaMock);
    jest.doMock('../src/services/notification.service', () => ({ notify: jest.fn() }));
    jest.doMock('@prisma/client', () => ({ Prisma: { TransactionIsolationLevel: { Serializable: 'Serializable' } } }));
    // eslint-disable-next-line global-require
    ({ createBooking } = require('../src/services/booking.service'));

    await expect(createBooking('customer-1', {
      roomId: 'room-1', checkInDate: new Date('2026-11-01'), checkOutDate: new Date('2026-11-04'),
      numAdults: 1, numChildren: 0, guests: [],
    })).rejects.toMatchObject({ code: 'ROOM_ALREADY_BOOKED', statusCode: 409 });
  });

  test('rejects a party size that exceeds room capacity', async () => {
    await expect(createBooking('customer-1', {
      roomId: 'room-1', checkInDate: new Date('2026-11-01'), checkOutDate: new Date('2026-11-04'),
      numAdults: 5, numChildren: 0, guests: [],
    })).rejects.toMatchObject({ code: 'CAPACITY_EXCEEDED' });
  });
});

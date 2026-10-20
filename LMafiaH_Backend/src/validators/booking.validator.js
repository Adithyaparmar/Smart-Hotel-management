const { z } = require('zod');

const guestSchema = z.object({
  fullName: z.string().min(1).max(120),
  age: z.number().int().min(0).max(120).optional(),
  idType: z.string().max(60).optional(),
  idNumber: z.string().max(60).optional(),
});

const createBookingSchema = z.object({
  roomId: z.string().uuid(),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  numAdults: z.number().int().min(1).default(1),
  numChildren: z.number().int().min(0).default(0),
  specialRequests: z.string().max(1000).optional(),
  guests: z.array(guestSchema).default([]),
  discountCode: z.string().max(40).optional(),
}).refine((d) => d.checkOutDate > d.checkInDate, {
  message: 'checkOutDate must be after checkInDate',
  path: ['checkOutDate'],
}).refine((d) => d.checkInDate >= new Date(new Date().toDateString()), {
  message: 'checkInDate cannot be in the past',
  path: ['checkInDate'],
});

const priceQuoteSchema = z.object({
  roomId: z.string().uuid(),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  discountCode: z.string().max(40).optional(),
}).refine((d) => d.checkOutDate > d.checkInDate, {
  message: 'checkOutDate must be after checkInDate',
  path: ['checkOutDate'],
});

const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  customerId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
});

module.exports = {
  createBookingSchema,
  priceQuoteSchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
};

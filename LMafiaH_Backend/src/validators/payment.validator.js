const { z } = require('zod');

const createOrderSchema = z.object({
  bookingId: z.string().uuid(),
});

const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  providerOrderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().min(1).optional(), // required for Razorpay, absent for mock
});

module.exports = { createOrderSchema, verifyPaymentSchema };

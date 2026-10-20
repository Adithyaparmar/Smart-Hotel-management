const { z } = require('zod');

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});

const staffResponseSchema = z.object({
  staffResponse: z.string().min(1).max(2000),
});

module.exports = { createReviewSchema, updateReviewSchema, staffResponseSchema };

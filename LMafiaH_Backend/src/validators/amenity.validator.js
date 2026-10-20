const { z } = require('zod');

const createAmenitySchema = z.object({
  name: z.string().min(1).max(120),
  icon: z.string().max(120).optional(),
  category: z.enum(['ROOM', 'HOTEL', 'DINING', 'WELLNESS', 'BUSINESS']).default('ROOM'),
  description: z.string().max(500).optional(),
});

const updateAmenitySchema = createAmenitySchema.partial();

module.exports = { createAmenitySchema, updateAmenitySchema };

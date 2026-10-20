const { z } = require('zod');

const bedType = z.enum(['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'SUITE']);
const viewType = z.enum(['CITY', 'GARDEN', 'POOL', 'SEA', 'MOUNTAIN', 'COURTYARD']);

const createRoomTypeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1),
  basePrice: z.number().positive(),
  capacityAdults: z.number().int().min(1).default(2),
  capacityChildren: z.number().int().min(0).default(0),
  sizeSqft: z.number().int().positive(),
  bedType,
  defaultView: viewType,
  images: z.array(z.string().url()).default([]),
});

const updateRoomTypeSchema = createRoomTypeSchema.partial();

module.exports = { createRoomTypeSchema, updateRoomTypeSchema };

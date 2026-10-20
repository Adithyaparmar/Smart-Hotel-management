const { z } = require('zod');

const bedType = z.enum(['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'SUITE']);
const viewType = z.enum(['CITY', 'GARDEN', 'POOL', 'SEA', 'MOUNTAIN', 'COURTYARD']);
const roomStatus = z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE']);

const createRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  roomTypeId: z.string().uuid(),
  description: z.string().min(1),
  floor: z.number().int().min(0),
  price: z.number().positive().optional(),
  capacityAdults: z.number().int().min(1).default(2),
  capacityChildren: z.number().int().min(0).default(0),
  sizeSqft: z.number().int().positive(),
  bedType,
  viewType,
  images: z.array(z.string().url()).default([]),
  amenityIds: z.array(z.string().uuid()).optional(),
});

const updateRoomSchema = createRoomSchema.partial();

const listRoomsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['price', 'createdAt', 'roomNumber', 'capacityAdults']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: roomStatus.optional(),
  roomTypeId: z.string().uuid().optional(),
  bedType: bedType.optional(),
  viewType: viewType.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  search: z.string().max(120).optional(),
  isActive: z.coerce.boolean().optional(),
});

const availabilityQuerySchema = z.object({
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  adults: z.coerce.number().int().min(1).default(1),
  children: z.coerce.number().int().min(0).default(0),
  roomTypeId: z.string().uuid().optional(),
}).refine((d) => d.checkOutDate > d.checkInDate, {
  message: 'checkOutDate must be after checkInDate',
  path: ['checkOutDate'],
});

const updateRoomStatusSchema = z.object({
  status: roomStatus,
  reason: z.string().max(255).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = {
  createRoomSchema,
  updateRoomSchema,
  listRoomsQuerySchema,
  availabilityQuerySchema,
  updateRoomStatusSchema,
  idParamSchema,
};

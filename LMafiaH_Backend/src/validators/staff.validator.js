const { z } = require('zod');

const createStaffSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  role: z.enum(['STAFF', 'ADMIN']).default('STAFF'),
  department: z.enum(['FRONT_DESK', 'HOUSEKEEPING', 'CONCIERGE', 'MANAGEMENT', 'SECURITY', 'FOOD_AND_BEVERAGE']),
  position: z.string().min(1).max(120),
  shift: z.enum(['MORNING', 'EVENING', 'NIGHT']),
});

const createTaskSchema = z.object({
  assignedToId: z.string().uuid().optional(),
  type: z.enum(['HOUSEKEEPING', 'MAINTENANCE', 'GUEST_REQUEST', 'CHECK_IN_PREP', 'CHECK_OUT_PREP', 'OTHER']),
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  roomId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueAt: z.coerce.date().optional(),
});

const updateTaskSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  assignedToId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

module.exports = { createStaffSchema, createTaskSchema, updateTaskSchema };

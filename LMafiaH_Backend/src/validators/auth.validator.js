const { z } = require('zod');

const password = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(20).optional(),
  password,
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(), // may also arrive via httpOnly cookie
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: password,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  phone: z.string().min(7).max(20).optional(),
  preferredView: z.enum(['CITY', 'GARDEN', 'POOL', 'SEA', 'MOUNTAIN', 'COURTYARD']).optional(),
  preferredBed: z.enum(['SINGLE', 'DOUBLE', 'QUEEN', 'KING', 'TWIN', 'SUITE']).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};

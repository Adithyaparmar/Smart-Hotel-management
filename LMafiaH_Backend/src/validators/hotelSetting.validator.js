const { z } = require('zod');

const upsertSettingSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.any(),
  description: z.string().max(255).optional(),
});

module.exports = { upsertSettingSchema };

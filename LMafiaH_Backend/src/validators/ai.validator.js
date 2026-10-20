const { z } = require('zod');

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
});

module.exports = { chatSchema };

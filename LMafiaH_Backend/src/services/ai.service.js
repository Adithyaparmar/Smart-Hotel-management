const axios = require('axios');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const logger = require('../utils/logger');

const aiClient = axios.create({
  baseURL: env.aiService.baseUrl,
  timeout: 90000,
  headers: { 'x-internal-key': env.aiService.internalKey },
});

async function getOrCreateConversation(userId, conversationId) {
  if (conversationId) {
    const existing = await prisma.aIConversation.findUnique({ where: { id: conversationId } });
    if (!existing || existing.userId !== userId) {
      throw AppError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
    }
    return existing;
  }
  return prisma.aIConversation.create({ data: { userId, status: 'ACTIVE' } });
}

async function chat(user, { conversationId, message }) {
  const conversation = await getOrCreateConversation(user.id, conversationId);

  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: 'USER', content: message },
  });

  const history = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 30,
  });

  let orchestratorResponse;
  try {
    const { data } = await aiClient.post('/api/orchestrate', {
      conversationId: conversation.id,
      userId: user.id,
      userRole: user.role,
      userFirstName: user.firstName,
      message,
      history: history.map((h) => ({ role: h.role, content: h.content })),
    });
    orchestratorResponse = data;
  } catch (err) {
    const providerStatus = err.response?.status;
    const providerMessage = err.response?.data?.message || err.response?.data?.detail || err.message;
    logger.error(`AI service call failed: ${providerStatus || 'ERR'} ${providerMessage}`);

    if (providerStatus === 429 || /rate limit/i.test(providerMessage || '')) {
      throw AppError.tooManyRequests(
        'The Consigliere is temporarily at its AI request limit. Please wait a moment and try again.',
        'AI_RATE_LIMITED'
      );
    }

    throw AppError.internal(
      'The Consigliere is unavailable at the moment. Please try again shortly.',
      'AI_SERVICE_UNAVAILABLE'
    );
  }

  const assistantMessage = await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT',
      content: orchestratorResponse.reply,
      toolName: orchestratorResponse.toolCalls?.[0]?.toolName,
      toolPayload: orchestratorResponse.toolCalls?.length ? orchestratorResponse.toolCalls : undefined,
    },
  });

  await prisma.aIConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  return {
    conversationId: conversation.id,
    reply: orchestratorResponse.reply,
    requiresConfirmation: orchestratorResponse.requiresConfirmation || false,
    pendingAction: orchestratorResponse.pendingAction || null,
    toolCalls: orchestratorResponse.toolCalls || [],
    messageId: assistantMessage.id,
  };
}

async function listConversations(userId, { page = 1, limit = 20 } = {}) {
  const where = { userId };
  const [items, total] = await prisma.$transaction([
    prisma.aIConversation.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' },
    }),
    prisma.aIConversation.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getConversation(userId, conversationId) {
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation || conversation.userId !== userId) {
    throw AppError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
  }
  return conversation;
}

async function closeConversation(userId, conversationId) {
  const conversation = await prisma.aIConversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.userId !== userId) {
    throw AppError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
  }
  return prisma.aIConversation.update({ where: { id: conversationId }, data: { status: 'CLOSED' } });
}

module.exports = { chat, listConversations, getConversation, closeConversation };

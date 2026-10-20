const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const aiService = require('../services/ai.service');
const aiToolsService = require('../services/aiTools.service');

const chat = asyncHandler(async (req, res) => {
  const result = await aiService.chat(req.user, req.body);
  return ApiResponse.success(res, { data: result, message: 'The Consigliere responds' });
});

const listConversations = asyncHandler(async (req, res) => {
  const result = await aiService.listConversations(req.user.id, req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
});

const getConversation = asyncHandler(async (req, res) => {
  const conversation = await aiService.getConversation(req.user.id, req.params.id);
  return ApiResponse.success(res, { data: conversation });
});

const closeConversation = asyncHandler(async (req, res) => {
  const conversation = await aiService.closeConversation(req.user.id, req.params.id);
  return ApiResponse.success(res, { data: conversation, message: 'Conversation closed' });
});

const listMemories = asyncHandler(async (req, res) => {
  const memories = await aiToolsService.getUserMemories(req.user.id);
  return ApiResponse.success(res, { data: memories });
});

const deleteMemory = asyncHandler(async (req, res) => {
  await aiToolsService.deleteUserMemory(req.user.id, req.params.key);
  return ApiResponse.success(res, { message: 'Memory forgotten' });
});

module.exports = { chat, listConversations, getConversation, closeConversation, listMemories, deleteMemory };

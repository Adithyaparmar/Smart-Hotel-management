const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const aiToolsService = require('../services/aiTools.service');
const { recordAudit } = require('../middleware/auditLog');

/**
 * Called ONLY by the Python AI service (server-to-server, verified by
 * internalAuth middleware) when the LLM decides it needs a controlled tool.
 * This is the single choke point through which AI-driven actions reach the
 * database — every call re-runs the same authorization rules as the public
 * REST API via aiTools.service.js.
 */
const runTool = asyncHandler(async (req, res) => {
  const { toolName, params, userId, userRole } = req.body;
  const authContext = { userId, role: userRole };

  const result = await aiToolsService.executeTool(toolName, params, authContext);

  if (['createBooking', 'cancelBooking'].includes(toolName) && !result.requiresConfirmation) {
    await recordAudit({
      actorUserId: userId,
      action: `AI_TOOL_${toolName.toUpperCase()}`,
      entityType: 'Booking',
      entityId: result.result?.id,
      metadata: { params },
    });
  }

  return ApiResponse.success(res, { data: result });
});

const upsertMemory = asyncHandler(async (req, res) => {
  const { userId, key, value, category } = req.body;
  const memory = await aiToolsService.upsertUserMemory(userId, { key, value, category });
  return ApiResponse.success(res, { data: memory });
});

const getMemories = asyncHandler(async (req, res) => {
  const memories = await aiToolsService.getUserMemories(req.params.userId);
  return ApiResponse.success(res, { data: memories });
});

module.exports = { runTool, upsertMemory, getMemories };

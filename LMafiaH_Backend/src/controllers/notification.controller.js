const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const notificationService = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const result = await notificationService.listForUser(req.user.id, req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages, unreadCount: result.unreadCount } });
});

const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.user.id, req.params.id);
  return ApiResponse.success(res, { message: 'Marked as read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  return ApiResponse.success(res, { message: 'All notifications marked as read' });
});

module.exports = { list, markRead, markAllRead };

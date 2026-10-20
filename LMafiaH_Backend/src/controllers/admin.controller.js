const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const analyticsService = require('../services/analytics.service');
const userService = require('../services/user.service');

const dashboard = asyncHandler(async (req, res) => {
  const data = await analyticsService.dashboardOverview();
  return ApiResponse.success(res, { data });
});

const listCustomers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers({ ...req.query, role: 'CUSTOMER' });
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
});

const setUserActive = asyncHandler(async (req, res) => {
  const user = await userService.setUserActive(req.params.id, req.body.isActive, req.user.role);
  return ApiResponse.success(res, { data: user, message: `User ${req.body.isActive ? 'activated' : 'deactivated'}` });
});

module.exports = { dashboard, listCustomers, setUserActive };

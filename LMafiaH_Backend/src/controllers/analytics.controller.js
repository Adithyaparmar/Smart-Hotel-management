const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const analyticsService = require('../services/analytics.service');

const overview = asyncHandler(async (req, res) => {
  const data = await analyticsService.dashboardOverview();
  return ApiResponse.success(res, { data });
});
const revenue = asyncHandler(async (req, res) => {
  const data = await analyticsService.revenueSeries(req.query);
  return ApiResponse.success(res, { data });
});
const bookingTrends = asyncHandler(async (req, res) => {
  const data = await analyticsService.bookingTrends(req.query);
  return ApiResponse.success(res, { data });
});
const roomPopularity = asyncHandler(async (req, res) => {
  const data = await analyticsService.roomPopularity(req.query);
  return ApiResponse.success(res, { data });
});
const averageBookingValue = asyncHandler(async (req, res) => {
  const data = await analyticsService.averageBookingValue();
  return ApiResponse.success(res, { data });
});
const aiInsights = asyncHandler(async (req, res) => {
  const data = await analyticsService.aiInsightsSummary();
  return ApiResponse.success(res, { data });
});

module.exports = { overview, revenue, bookingTrends, roomPopularity, averageBookingValue, aiInsights };

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const settingsService = require('../services/hotelSetting.service');

const list = asyncHandler(async (req, res) => {
  const data = await settingsService.listSettings();
  return ApiResponse.success(res, { data });
});

const upsert = asyncHandler(async (req, res) => {
  const setting = await settingsService.upsertSetting(req.body, req.user.id);
  return ApiResponse.success(res, { data: setting, message: 'Setting updated' });
});

module.exports = { list, upsert };

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const roomTypeService = require('../services/roomType.service');

const createRoomType = asyncHandler(async (req, res) => {
  const rt = await roomTypeService.createRoomType(req.body);
  return ApiResponse.success(res, { data: rt, message: 'Room type created', statusCode: 201 });
});
const updateRoomType = asyncHandler(async (req, res) => {
  const rt = await roomTypeService.updateRoomType(req.params.id, req.body);
  return ApiResponse.success(res, { data: rt, message: 'Room type updated' });
});
const listRoomTypes = asyncHandler(async (req, res) => {
  const items = await roomTypeService.listRoomTypes();
  return ApiResponse.success(res, { data: items });
});
const getRoomType = asyncHandler(async (req, res) => {
  const rt = await roomTypeService.getRoomType(req.params.id);
  return ApiResponse.success(res, { data: rt });
});
const deactivateRoomType = asyncHandler(async (req, res) => {
  await roomTypeService.deactivateRoomType(req.params.id);
  return ApiResponse.success(res, { message: 'Room type deactivated' });
});

module.exports = { createRoomType, updateRoomType, listRoomTypes, getRoomType, deactivateRoomType };

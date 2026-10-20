const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const roomService = require('../services/room.service');

const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.body);
  return ApiResponse.success(res, { data: room, message: 'Room created', statusCode: 201 });
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoom(req.params.id, req.body);
  return ApiResponse.success(res, { data: room, message: 'Room updated' });
});

const deactivateRoom = asyncHandler(async (req, res) => {
  await roomService.deactivateRoom(req.params.id);
  return ApiResponse.success(res, { message: 'Room deactivated' });
});

const getRoom = asyncHandler(async (req, res) => {
  const room = await roomService.getRoom(req.params.id);
  return ApiResponse.success(res, { data: room });
});

const listRooms = asyncHandler(async (req, res) => {
  const result = await roomService.listRooms(req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
});

const checkAvailability = asyncHandler(async (req, res) => {
  const rooms = await roomService.searchAvailability(req.query);
  return ApiResponse.success(res, { data: rooms, message: `${rooms.length} room(s) available` });
});

const updateRoomStatus = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoomStatus(req.params.id, req.body.status, req.user.id, req.body.reason);
  return ApiResponse.success(res, { data: room, message: 'Room status updated' });
});

module.exports = { createRoom, updateRoom, deactivateRoom, getRoom, listRooms, checkAvailability, updateRoomStatus };

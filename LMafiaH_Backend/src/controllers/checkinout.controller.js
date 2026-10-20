const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const checkinoutService = require('../services/checkinout.service');

const checkIn = asyncHandler(async (req, res) => {
  const booking = await checkinoutService.checkIn(req.params.id, req.user.id);
  return ApiResponse.success(res, { data: booking, message: 'Guest checked in' });
});

const checkOut = asyncHandler(async (req, res) => {
  const booking = await checkinoutService.checkOut(req.params.id, req.user.id);
  return ApiResponse.success(res, { data: booking, message: 'Guest checked out' });
});

const todaysCheckIns = asyncHandler(async (req, res) => {
  const data = await checkinoutService.todaysCheckIns();
  return ApiResponse.success(res, { data });
});

const todaysCheckOuts = asyncHandler(async (req, res) => {
  const data = await checkinoutService.todaysCheckOuts();
  return ApiResponse.success(res, { data });
});

module.exports = { checkIn, checkOut, todaysCheckIns, todaysCheckOuts };

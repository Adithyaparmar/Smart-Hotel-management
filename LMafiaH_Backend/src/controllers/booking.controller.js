const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const bookingService = require('../services/booking.service');
const pricingService = require('../services/pricing.service');

const quotePrice = asyncHandler(async (req, res) => {
  const breakdown = await pricingService.calculateBookingPrice(req.body);
  return ApiResponse.success(res, { data: breakdown, message: 'Price calculated' });
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  return ApiResponse.success(res, { data: booking, message: 'Booking created — complete payment to confirm your reservation', statusCode: 201 });
});

const myBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.listMyBookings(req.user.id, req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
});

const listBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.listBookings(req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  return ApiResponse.success(res, { data: booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user, req.body.reason);
  return ApiResponse.success(res, { data: booking, message: 'Booking cancelled' });
});

module.exports = { quotePrice, createBooking, myBookings, listBookings, getBooking, cancelBooking };

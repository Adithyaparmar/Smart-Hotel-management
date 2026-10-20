const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const reviewService = require('../services/review.service');

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user.id, req.body);
  return ApiResponse.success(res, { data: review, message: 'Thank you for your review', statusCode: 201 });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, { data: review, message: 'Review updated' });
});

const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.user.id, req.params.id, req.user.role);
  return ApiResponse.success(res, { message: 'Review deleted' });
});

const listRoomReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.listRoomReviews(req.params.roomId, req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages, averageRating: result.averageRating } });
});

const respondToReview = asyncHandler(async (req, res) => {
  const review = await reviewService.respondToReview(req.params.id, req.body.staffResponse);
  return ApiResponse.success(res, { data: review, message: 'Response posted' });
});

module.exports = { createReview, updateReview, deleteReview, listRoomReviews, respondToReview };

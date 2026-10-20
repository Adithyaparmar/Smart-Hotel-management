const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const paymentService = require('../services/payment.service');

const createOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.createOrder(req.body.bookingId, req.user);
  return ApiResponse.success(res, { data: order, message: 'Payment order created', statusCode: 201 });
});

const verify = asyncHandler(async (req, res) => {
  const payment = await paymentService.verifyPayment(req.body, req.user);
  return ApiResponse.success(res, { data: payment, message: 'Payment verified — booking confirmed' });
});

// Raw body is required for Razorpay HMAC signature verification — see routes/payment.routes.js
// where this route is mounted with express.raw() instead of the global JSON parser.
const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await paymentService.handleWebhook(req.body, signature);
  return res.status(200).json({ success: true, data: result });
});

module.exports = { createOrder, verify, webhook };

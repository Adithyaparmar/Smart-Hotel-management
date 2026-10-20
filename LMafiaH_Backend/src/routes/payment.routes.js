const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, verifyPaymentSchema } = require('../validators/payment.validator');

router.post('/create-order', authenticate, validate({ body: createOrderSchema }), paymentController.createOrder);
router.post('/verify', authenticate, validate({ body: verifyPaymentSchema }), paymentController.verify);

// Razorpay webhooks are server-to-server and unauthenticated by JWT — verified
// instead via HMAC signature. The raw (unparsed) body required for that check
// is already provided by app.js, which scopes express.raw() to this exact path
// before the global JSON parser runs — see src/app.js.
router.post('/webhook', paymentController.webhook);

module.exports = router;

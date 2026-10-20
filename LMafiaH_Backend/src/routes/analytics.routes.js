const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/overview', analyticsController.overview);
router.get('/revenue', analyticsController.revenue);
router.get('/booking-trends', analyticsController.bookingTrends);
router.get('/room-popularity', analyticsController.roomPopularity);
router.get('/average-booking-value', analyticsController.averageBookingValue);
router.get('/ai-insights', analyticsController.aiInsights);

module.exports = router;

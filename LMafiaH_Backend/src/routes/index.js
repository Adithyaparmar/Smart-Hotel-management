const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/rooms', require('./room.routes'));
router.use('/room-types', require('./roomType.routes'));
router.use('/amenities', require('./amenity.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/hotel-settings', require('./hotelSetting.routes'));
router.use('/ai', require('./ai.routes'));

// Internal, server-to-server only — see internal.routes.js.
router.use('/internal', require('./internal.routes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'Luxury Mafia Hotel API is running', data: { timestamp: new Date().toISOString() } }));

module.exports = router;

const router = require('express').Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createBookingSchema, priceQuoteSchema, cancelBookingSchema, listBookingsQuerySchema,
} = require('../validators/booking.validator');
const { idParamSchema } = require('../validators/room.validator');

router.post('/quote', authenticate, validate({ body: priceQuoteSchema }), bookingController.quotePrice);
router.post('/', authenticate, authorize('CUSTOMER'), validate({ body: createBookingSchema }), bookingController.createBooking);
router.get('/my', authenticate, authorize('CUSTOMER'), bookingController.myBookings);
router.get('/', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), validate({ query: listBookingsQuerySchema }), bookingController.listBookings);
router.get('/:id', authenticate, validate({ params: idParamSchema }), bookingController.getBooking);
router.patch('/:id/cancel', authenticate, validate({ params: idParamSchema, body: cancelBookingSchema }), bookingController.cancelBooking);

// Staff/admin check-in & check-out operations live here to keep the booking
// resource's full lifecycle under one router.
const checkinoutController = require('../controllers/checkinout.controller');
router.post('/:id/check-in', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema }), checkinoutController.checkIn);
router.post('/:id/check-out', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema }), checkinoutController.checkOut);

module.exports = router;

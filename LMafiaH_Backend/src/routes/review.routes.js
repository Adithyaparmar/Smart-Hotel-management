const router = require('express').Router();
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createReviewSchema, updateReviewSchema, staffResponseSchema } = require('../validators/review.validator');
const { idParamSchema } = require('../validators/room.validator');

router.get('/room/:roomId', reviewController.listRoomReviews);
router.post('/', authenticate, authorize('CUSTOMER'), validate({ body: createReviewSchema }), reviewController.createReview);
router.patch('/:id', authenticate, authorize('CUSTOMER'), validate({ params: idParamSchema, body: updateReviewSchema }), reviewController.updateReview);
router.delete('/:id', authenticate, validate({ params: idParamSchema }), reviewController.deleteReview);
router.post('/:id/respond', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema, body: staffResponseSchema }), reviewController.respondToReview);

module.exports = router;

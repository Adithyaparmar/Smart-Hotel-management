const router = require('express').Router();
const roomTypeController = require('../controllers/roomType.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createRoomTypeSchema, updateRoomTypeSchema } = require('../validators/roomType.validator');
const { idParamSchema } = require('../validators/room.validator');

router.get('/', roomTypeController.listRoomTypes);
router.get('/:id', validate({ params: idParamSchema }), roomTypeController.getRoomType);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ body: createRoomTypeSchema }), roomTypeController.createRoomType);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema, body: updateRoomTypeSchema }), roomTypeController.updateRoomType);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema }), roomTypeController.deactivateRoomType);

module.exports = router;

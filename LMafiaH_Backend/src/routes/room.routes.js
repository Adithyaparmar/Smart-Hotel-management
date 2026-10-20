const router = require('express').Router();
const roomController = require('../controllers/room.controller');
const { authenticate, authenticateOptional } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createRoomSchema, updateRoomSchema, listRoomsQuerySchema,
  availabilityQuerySchema, updateRoomStatusSchema, idParamSchema,
} = require('../validators/room.validator');

// Public browsing — no auth required to view rooms/availability.
router.get('/', authenticateOptional, validate({ query: listRoomsQuerySchema }), roomController.listRooms);
router.get('/availability', validate({ query: availabilityQuerySchema }), roomController.checkAvailability);
router.get('/:id', validate({ params: idParamSchema }), roomController.getRoom);

// Admin-managed.
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ body: createRoomSchema }), roomController.createRoom);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema, body: updateRoomSchema }), roomController.updateRoom);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema }), roomController.deactivateRoom);

// Staff+ can update operational status (e.g. CLEANING -> AVAILABLE).
router.patch('/:id/status', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema, body: updateRoomStatusSchema }), roomController.updateRoomStatus);

module.exports = router;

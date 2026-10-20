const router = require('express').Router();
const amenityController = require('../controllers/amenity.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createAmenitySchema, updateAmenitySchema } = require('../validators/amenity.validator');
const { idParamSchema } = require('../validators/room.validator');

router.get('/', amenityController.listAmenities);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ body: createAmenitySchema }), amenityController.createAmenity);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema, body: updateAmenitySchema }), amenityController.updateAmenity);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema }), amenityController.deleteAmenity);

module.exports = router;

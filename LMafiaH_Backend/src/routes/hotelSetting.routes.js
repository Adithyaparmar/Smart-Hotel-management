const router = require('express').Router();
const settingController = require('../controllers/hotelSetting.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { upsertSettingSchema } = require('../validators/hotelSetting.validator');

router.get('/', settingController.list); // public — hotel policy info (check-in time, etc.)
router.put('/', authenticate, authorize('SUPER_ADMIN'), validate({ body: upsertSettingSchema }), settingController.upsert);

module.exports = router;

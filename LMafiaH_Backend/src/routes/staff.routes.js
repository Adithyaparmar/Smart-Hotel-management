const router = require('express').Router();
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createStaffSchema, createTaskSchema, updateTaskSchema } = require('../validators/staff.validator');
const { idParamSchema } = require('../validators/room.validator');
const checkinoutController = require('../controllers/checkinout.controller');

router.get('/dashboard', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), staffController.dashboard);
router.get('/check-ins/today', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), checkinoutController.todaysCheckIns);
router.get('/check-outs/today', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), checkinoutController.todaysCheckOuts);

router.get('/tasks', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), staffController.listTasks);
router.post('/tasks', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), validate({ body: createTaskSchema }), staffController.createTask);
router.patch('/tasks/:id', authenticate, authorize('STAFF', 'ADMIN', 'SUPER_ADMIN'), validate({ params: idParamSchema, body: updateTaskSchema }), staffController.updateTask);

// Staff account provisioning is an ADMIN action.
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), staffController.listStaff);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), validate({ body: createStaffSchema }), staffController.createStaff);

module.exports = router;

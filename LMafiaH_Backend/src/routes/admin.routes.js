const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const validate = require('../middleware/validate');

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.get('/customers', adminController.listCustomers);
router.patch('/customers/:id/status', adminController.setUserActive);

module.exports = router;

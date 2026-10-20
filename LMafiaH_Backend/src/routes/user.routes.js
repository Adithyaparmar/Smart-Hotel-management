const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const userService = require('../services/user.service');

router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return ApiResponse.success(res, { data: result.items, meta: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
}));

router.patch('/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req, res) => {
  const user = await userService.setUserActive(req.params.id, req.body.isActive, req.user.role);
  return ApiResponse.success(res, { data: user, message: `User ${req.body.isActive ? 'activated' : 'deactivated'}` });
}));

module.exports = router;

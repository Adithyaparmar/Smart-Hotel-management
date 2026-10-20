const AppError = require('../utils/AppError');

/**
 * Coarse role-gate middleware. Every protected route declares which roles
 * may call it; role comes only from req.user, which was populated by
 * `authenticate` directly from the database — never from client input.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(
        `Role '${req.user.role}' is not permitted to perform this action`,
        'FORBIDDEN_ROLE'
      ));
    }
    next();
  };
}

/**
 * Ownership guard for customer-scoped resources (e.g. "view own booking").
 * `getOwnerId(req)` should resolve the resource's owning user id (may hit DB).
 * STAFF/ADMIN/SUPER_ADMIN bypass ownership checks by design.
 */
function authorizeOwnerOrRoles(getOwnerId, ...bypassRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) return next(AppError.unauthorized());
      if (bypassRoles.includes(req.user.role)) return next();

      const ownerId = await getOwnerId(req);
      if (ownerId && ownerId === req.user.id) return next();

      return next(AppError.forbidden('You do not have access to this resource', 'FORBIDDEN_OWNERSHIP'));
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { authorize, authorizeOwnerOrRoles };

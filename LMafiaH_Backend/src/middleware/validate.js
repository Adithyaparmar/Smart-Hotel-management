const AppError = require('../utils/AppError');

/**
 * Validates req.body / req.query / req.params against a Zod schema map:
 *   validate({ body: bookingCreateSchema })
 * Replaces the raw request data with the parsed (and type-coerced) result.
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      const details = err.errors?.map((e) => ({ path: e.path.join('.'), message: e.message }));
      next(AppError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
    }
  };
}

module.exports = validate;

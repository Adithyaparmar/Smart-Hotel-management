const AppError = require('../utils/AppError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Prisma known errors -> operational AppErrors, never leak raw DB details.
  if (err.code === 'P2002') {
    error = AppError.conflict(`Duplicate value for: ${err.meta?.target || 'unique field'}`, 'DUPLICATE_ENTRY');
  } else if (err.code === 'P2025') {
    error = AppError.notFound('Record not found', 'NOT_FOUND');
  } else if (err.code === 'P2003') {
    error = AppError.badRequest('Related record does not exist', 'INVALID_REFERENCE');
  } else if (!(err instanceof AppError)) {
    error = AppError.internal(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    );
  }

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  return ApiResponse.error(res, {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
  });
}

module.exports = { notFoundHandler, errorHandler };

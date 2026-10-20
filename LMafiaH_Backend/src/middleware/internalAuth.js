const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Guards the machine-to-machine channel used exclusively by the Python AI
 * service to invoke controlled tools. Never exposed to the browser/frontend —
 * only reachable server-to-server, and only with the shared internal key.
 */
function internalAuth(req, res, next) {
  const key = req.headers['x-internal-key'];
  if (!key || key !== env.aiService.internalKey) {
    return next(AppError.unauthorized('Invalid internal service key', 'INTERNAL_AUTH_FAILED'));
  }
  next();
}

module.exports = internalAuth;

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/tokens');
const prisma = require('../config/database');

/**
 * Verifies the JWT access token and attaches a fresh `req.user` from the
 * database (never trusts stale claims for role/isActive — those are re-read
 * on every request so a demoted/disabled user is rejected immediately).
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw AppError.unauthorized('Authentication token missing', 'AUTH_TOKEN_MISSING');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired token', 'AUTH_TOKEN_INVALID');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user || !user.isActive) {
    throw AppError.unauthorized('Account not found or disabled', 'AUTH_USER_INVALID');
  }

  // req.user is the backend's own source of truth for role — the frontend
  // never gets to assert its own role for authorization purposes.
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  next();
});

/** Optional auth: attaches req.user if a valid token is present, but never rejects. */
const authenticateOptional = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.isActive) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
  } catch (err) {
    // ignore — request proceeds unauthenticated
  }
  next();
});

module.exports = { authenticate, authenticateOptional };

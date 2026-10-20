const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { hashPassword, verifyPassword } = require('../utils/password');
const {
  signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, generateOpaqueToken,
} = require('../utils/tokens');
const env = require('../config/env');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}

async function issueTokenPair(user, meta = {}) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: 1 });

  const decoded = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  return { accessToken, refreshToken };
}

async function register({ email, phone, password, firstName, lastName }) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, phone ? { phone } : undefined].filter(Boolean) },
  });
  if (existing) {
    throw AppError.conflict('An account with this email or phone already exists', 'ACCOUNT_EXISTS');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, phone, passwordHash, firstName, lastName, role: 'CUSTOMER' },
    });
    await tx.customerProfile.create({ data: { userId: created.id } });
    return created;
  });

  await notificationService.notify({
    userId: user.id,
    type: 'GENERAL',
    title: 'Welcome to Luxury Mafia Hotel',
    message: `Benvenuto, ${user.firstName}. Your account has been created. The Consigliere is at your service.`,
    channel: 'IN_APP',
  }).catch((err) => logger.warn(`Welcome notification failed: ${err.message}`));

  return toPublicUser(user);
}

async function login({ email, password }, meta = {}) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  if (!user.isActive) throw AppError.forbidden('This account has been deactivated', 'ACCOUNT_DISABLED');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokenPair(user, meta);
  return { user: toPublicUser(user), ...tokens };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw AppError.unauthorized('Refresh token missing', 'REFRESH_TOKEN_MISSING');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw AppError.unauthorized('Refresh token is no longer valid', 'REFRESH_TOKEN_INVALID');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw AppError.unauthorized('Account not found or disabled', 'AUTH_USER_INVALID');

  // Rotate: revoke the used refresh token and issue a brand new pair.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const tokens = await issueTokenPair(user);

  const accessToken = tokens.accessToken;
  return { accessToken, refreshToken: tokens.refreshToken, user: toPublicUser(user) };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function logoutAllSessions(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond as if successful — never reveal whether an email is registered.
  if (!user) return;

  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.passwordResetExpiresMin * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt },
  });

  await notificationService.notify({
    userId: user.id,
    type: 'GENERAL',
    title: 'Password reset requested',
    message: 'A password reset was requested for your account. If this was not you, please contact us immediately.',
    channel: 'EMAIL',
    data: { resetToken: rawToken }, // in production this is emailed, never returned via API
  }).catch((err) => logger.warn(`Password reset notification failed: ${err.message}`));

  if (!env.isProd) {
    logger.debug(`[DEV ONLY] Password reset token for ${email}: ${rawToken}`);
  }
}

async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw AppError.badRequest('Reset token is invalid or has expired', 'RESET_TOKEN_INVALID');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) throw AppError.unauthorized('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Force re-login everywhere else for safety.
  await logoutAllSessions(userId);
}

module.exports = {
  toPublicUser,
  register,
  login,
  refresh,
  logout,
  logoutAllSessions,
  forgotPassword,
  resetPassword,
  changePassword,
};

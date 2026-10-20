const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');

const REFRESH_COOKIE = 'lmh_refresh_token';
const cookieOptions = (env) => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
});

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return ApiResponse.success(res, { data: user, message: 'Account created successfully', statusCode: 201 });
});

const login = asyncHandler(async (req, res) => {
  const env = require('../config/env');
  const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta);
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(env));
  return ApiResponse.success(res, { data: { user, accessToken }, message: 'Logged in successfully' });
});

const refresh = asyncHandler(async (req, res) => {
  const env = require('../config/env');
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  const result = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions(env));
  return ApiResponse.success(res, { data: { user: result.user, accessToken: result.accessToken }, message: 'Token refreshed' });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  return ApiResponse.success(res, { message: 'Logged out successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return ApiResponse.success(res, { message: 'If that email is registered, a reset link has been sent.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  return ApiResponse.success(res, { message: 'Password has been reset. Please log in again.' });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  return ApiResponse.success(res, { message: 'Password changed successfully' });
});

const me = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  return ApiResponse.success(res, { data: profile });
});

const updateMe = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user.id, req.body);
  return ApiResponse.success(res, { data: profile, message: 'Profile updated' });
});

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, changePassword, me, updateMe };

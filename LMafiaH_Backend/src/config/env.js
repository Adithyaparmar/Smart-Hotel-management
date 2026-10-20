require('dotenv').config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  passwordResetExpiresMin: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MIN || '30', 10),

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Luxury Mafia Hotel <no-reply@luxurymafiahotel.com>',
  },

  aiService: {
    baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    internalKey: process.env.AI_SERVICE_INTERNAL_KEY || 'dev_internal_key',
  },

  rateLimit: {
    windowMin: parseInt(process.env.RATE_LIMIT_WINDOW_MIN || '15', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },

  pricing: {
    taxRatePercent: parseFloat(process.env.TAX_RATE_PERCENT || '12'),
    serviceChargePercent: parseFloat(process.env.SERVICE_CHARGE_PERCENT || '5'),
  },
};

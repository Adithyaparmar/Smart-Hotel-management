const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { defaultLimiter } = require('./middleware/rateLimit');
const logger = require('./utils/logger');

const app = express();

// crossOriginResourcePolicy defaults to 'same-origin' in Helmet, which blocks
// the browser from reading responses from a different origin — INDEPENDENTLY
// of CORS headers being correct. Since the frontend (Vite, localhost:5173)
// and this API (localhost:5000) are different origins by design, that default
// must be relaxed or every request will fail in the browser with
// ERR_BLOCKED_BY_RESPONSE.NotSameOrigin despite CORS looking fine.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(defaultLimiter);

// NOTE: the Razorpay webhook needs the untouched raw body to verify its HMAC
// signature. It gets express.raw() instead of express.json() below — every
// other route gets normal JSON parsing. Getting this order/scoping wrong is a
// classic Razorpay integration bug (json() consumes the stream before raw()
// can), so the webhook path is explicitly excluded from the JSON parser.
const WEBHOOK_PATH = '/api/payments/webhook';
app.use(WEBHOOK_PATH, express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
  if (req.originalUrl === WEBHOOK_PATH) return next();
  return express.json({ limit: '2mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

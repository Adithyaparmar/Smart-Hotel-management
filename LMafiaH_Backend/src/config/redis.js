const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      lazyConnect: false,
    });

    redis.on('error', (err) => {
      logger.warn(`Redis connection issue: ${err.message}`);
    });
  }
  return redis;
}

module.exports = { getRedis };

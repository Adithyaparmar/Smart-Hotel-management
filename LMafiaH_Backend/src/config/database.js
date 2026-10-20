const { PrismaClient } = require('@prisma/client');
const env = require('./env');

// Single shared Prisma instance (recommended pattern for Node long-running servers).
const prisma = new PrismaClient({
  log: env.isProd ? ['error', 'warn'] : ['error', 'warn'],
});

module.exports = prisma;

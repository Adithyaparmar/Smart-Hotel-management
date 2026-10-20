const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const prisma = require('./src/config/database');
const logger = require('./src/utils/logger');
const initSockets = require('./src/sockets');
const startJobs = require('./src/jobs');

const server = http.createServer(app);
initSockets(server);

async function start() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');

    server.listen(env.port, () => {
      logger.info(`Luxury Mafia Hotel API listening on port ${env.port} [${env.nodeEnv}]`);
    });

    startJobs();
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason?.stack || reason}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

start();

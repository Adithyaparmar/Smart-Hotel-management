const scheduleReleaseExpiredHolds = require('./releaseExpiredHolds.job');
const scheduleReminders = require('./reminders.job');
const logger = require('../utils/logger');

function startJobs() {
  scheduleReleaseExpiredHolds();
  scheduleReminders();
  logger.info('Background jobs scheduled (releaseExpiredHolds every 5m, reminders daily at 09:00)');
}

module.exports = startJobs;

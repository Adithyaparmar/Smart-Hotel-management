const cron = require('node-cron');
const bookingService = require('../services/booking.service');
const logger = require('../utils/logger');

/** Every 5 minutes: cancel PENDING bookings whose payment window has expired
 *  and free their room back to AVAILABLE, so unpaid holds don't starve inventory. */
function scheduleReleaseExpiredHolds() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const released = await bookingService.releaseExpiredHolds(20);
      if (released > 0) logger.info(`Released ${released} expired booking hold(s)`);
    } catch (err) {
      logger.error(`releaseExpiredHolds job failed: ${err.message}`);
    }
  });
}

module.exports = scheduleReleaseExpiredHolds;

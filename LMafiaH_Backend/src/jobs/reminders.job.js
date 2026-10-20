const cron = require('node-cron');
const prisma = require('../config/database');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

function startOfDay(d) { return new Date(new Date(d).toDateString()); }
function addDays(d, n) { return new Date(new Date(d).getTime() + n * 24 * 60 * 60 * 1000); }

/** Every day at 09:00: notify guests checking in or out tomorrow. */
function scheduleReminders() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const tomorrowStart = addDays(startOfDay(new Date()), 1);
      const tomorrowEnd = addDays(tomorrowStart, 1);

      const checkIns = await prisma.booking.findMany({
        where: { status: 'CONFIRMED', checkInDate: { gte: tomorrowStart, lt: tomorrowEnd } },
      });
      for (const b of checkIns) {
        await notificationService.notify({
          userId: b.customerId, type: 'CHECKIN_REMINDER', channel: 'EMAIL',
          title: 'Your stay begins tomorrow',
          message: `Reminder: your reservation ${b.bookingNumber} checks in tomorrow.`,
          data: { bookingId: b.id },
        });
      }

      const checkOuts = await prisma.booking.findMany({
        where: { status: 'CHECKED_IN', checkOutDate: { gte: tomorrowStart, lt: tomorrowEnd } },
      });
      for (const b of checkOuts) {
        await notificationService.notify({
          userId: b.customerId, type: 'CHECKOUT_REMINDER', channel: 'EMAIL',
          title: 'Check-out is tomorrow',
          message: `Reminder: check-out for ${b.bookingNumber} is tomorrow.`,
          data: { bookingId: b.id },
        });
      }

      logger.info(`Reminders sent: ${checkIns.length} check-in, ${checkOuts.length} check-out`);
    } catch (err) {
      logger.error(`reminders job failed: ${err.message}`);
    }
  });
}

module.exports = scheduleReminders;

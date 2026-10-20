const prisma = require('../config/database');

const DEFAULTS = {
  hotelName: 'Luxury Mafia Hotel',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  cancellationWindowHours: 24,
  taxRatePercent: 12,
  serviceChargePercent: 5,
  contactEmail: 'concierge@luxurymafiahotel.com',
  contactPhone: '+91-11-4000-1900',
};

async function getSettingValue(key, fallback) {
  const row = await prisma.hotelSetting.findUnique({ where: { key } });
  if (row) return row.value;
  return fallback ?? DEFAULTS[key];
}

async function listSettings() {
  const rows = await prisma.hotelSetting.findMany({ orderBy: { key: 'asc' } });
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...stored };
}

async function upsertSetting({ key, value, description }, actorUserId) {
  return prisma.hotelSetting.upsert({
    where: { key },
    update: { value, description, updatedByUserId: actorUserId },
    create: { key, value, description, updatedByUserId: actorUserId },
  });
}

module.exports = { getSettingValue, listSettings, upsertSetting, DEFAULTS };

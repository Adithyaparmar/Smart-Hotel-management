const prisma = require('../config/database');

function startOfDay(d = new Date()) { return new Date(new Date(d).toDateString()); }
function addDays(d, n) { return new Date(new Date(d).getTime() + n * 24 * 60 * 60 * 1000); }

/** Nothing here is hardcoded — every figure is derived from live rows in
 *  bookings/rooms/payments at request time. */
async function dashboardOverview() {
  const today = startOfDay();
  const tomorrow = addDays(today, 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalRooms, availableRooms, occupiedRooms, maintenanceRooms,
    todaysCheckIns, todaysCheckOuts,
    revenueAgg, monthlyRevenueAgg,
    totalBookings, cancelledBookings,
  ] = await prisma.$transaction([
    prisma.room.count({ where: { isActive: true } }),
    prisma.room.count({ where: { isActive: true, status: 'AVAILABLE' } }),
    prisma.room.count({ where: { isActive: true, status: 'OCCUPIED' } }),
    prisma.room.count({ where: { isActive: true, status: 'MAINTENANCE' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED', checkInDate: { gte: today, lt: tomorrow } } }),
    prisma.booking.count({ where: { status: 'CHECKED_IN', checkOutDate: { gte: today, lt: tomorrow } } }),
    prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'CAPTURED', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
  ]);

  const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2)) : 0;
  const cancellationRate = totalBookings > 0 ? Number(((cancelledBookings / totalBookings) * 100).toFixed(2)) : 0;

  return {
    rooms: { total: totalRooms, available: availableRooms, occupied: occupiedRooms, maintenance: maintenanceRooms },
    today: { checkIns: todaysCheckIns, checkOuts: todaysCheckOuts },
    revenue: {
      allTime: Number(revenueAgg._sum.amount || 0),
      monthToDate: Number(monthlyRevenueAgg._sum.amount || 0),
    },
    bookings: { total: totalBookings, cancelled: cancelledBookings, cancellationRate },
    occupancyRate,
  };
}

async function revenueSeries({ granularity = 'daily', days = 30 } = {}) {
  const since = addDays(startOfDay(), -days);
  const payments = await prisma.payment.findMany({
    where: { status: 'CAPTURED', createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
  });

  const buckets = new Map();
  for (const p of payments) {
    const key = granularity === 'monthly'
      ? `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`
      : p.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) || 0) + Number(p.amount));
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([period, revenue]) => ({ period, revenue: Number(revenue.toFixed(2)) }));
}

async function bookingTrends({ days = 30 } = {}) {
  const since = addDays(startOfDay(), -days);
  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, status: true, totalAmount: true },
  });

  const byDay = new Map();
  for (const b of bookings) {
    const key = b.createdAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key) || { date: key, count: 0, revenue: 0 };
    bucket.count += 1;
    if (b.status !== 'CANCELLED') bucket.revenue += Number(b.totalAmount);
    byDay.set(key, bucket);
  }

  return Array.from(byDay.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
}

async function roomPopularity({ limit = 10 } = {}) {
  const grouped = await prisma.booking.groupBy({
    by: ['roomId'],
    where: { status: { not: 'CANCELLED' } },
    _count: { roomId: true },
    orderBy: { _count: { roomId: 'desc' } },
    take: limit,
  });

  const rooms = await prisma.room.findMany({
    where: { id: { in: grouped.map((g) => g.roomId) } },
    include: { roomType: true },
  });
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  return grouped.map((g) => ({
    room: roomMap.get(g.roomId),
    bookingCount: g._count.roomId,
  }));
}

async function averageBookingValue() {
  const agg = await prisma.booking.aggregate({
    where: { status: { not: 'CANCELLED' } },
    _avg: { totalAmount: true },
    _count: true,
  });
  return { averageBookingValue: Number(agg._avg.totalAmount || 0), sampleSize: agg._count };
}

async function aiInsightsSummary() {
  // Lightweight operational signal for admins — not a call to the LLM itself.
  const [activeConversations, totalMemories, recentBookingsViaAI] = await prisma.$transaction([
    prisma.aIConversation.count({ where: { status: 'ACTIVE' } }),
    prisma.aIMemory.count(),
    prisma.aIMessage.count({ where: { toolName: 'createBooking', createdAt: { gte: addDays(startOfDay(), -30) } } }),
  ]);
  return { activeConversations, totalStoredMemories: totalMemories, bookingsCreatedViaAILast30Days: recentBookingsViaAI };
}

module.exports = {
  dashboardOverview, revenueSeries, bookingTrends, roomPopularity, averageBookingValue, aiInsightsSummary,
};

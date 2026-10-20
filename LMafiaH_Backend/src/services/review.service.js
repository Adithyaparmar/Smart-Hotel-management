const prisma = require('../config/database');
const AppError = require('../utils/AppError');

async function createReview(customerId, { bookingId, rating, title, comment }) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
  if (booking.customerId !== customerId) {
    throw AppError.forbidden('You can only review your own stays', 'FORBIDDEN_OWNERSHIP');
  }
  if (booking.status !== 'CHECKED_OUT') {
    throw AppError.conflict('You can only review completed stays', 'NOT_ELIGIBLE_FOR_REVIEW');
  }

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw AppError.conflict('This stay has already been reviewed', 'DUPLICATE_REVIEW');

  return prisma.review.create({
    data: { bookingId, customerId, roomId: booking.roomId, rating, title, comment },
  });
}

async function updateReview(customerId, reviewId, updates) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw AppError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  if (review.customerId !== customerId) throw AppError.forbidden('You can only edit your own review', 'FORBIDDEN_OWNERSHIP');

  return prisma.review.update({ where: { id: reviewId }, data: updates });
}

async function deleteReview(customerId, reviewId, actorRole) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw AppError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  if (review.customerId !== customerId && !['ADMIN', 'SUPER_ADMIN'].includes(actorRole)) {
    throw AppError.forbidden('You can only delete your own review', 'FORBIDDEN_OWNERSHIP');
  }
  await prisma.review.delete({ where: { id: reviewId } });
}

async function listRoomReviews(roomId, { page = 1, limit = 10 } = {}) {
  const where = { roomId, isPublished: true };
  const [items, total, agg] = await prisma.$transaction([
    prisma.review.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit), averageRating: agg._avg.rating || 0 };
}

async function respondToReview(reviewId, staffResponse) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw AppError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  return prisma.review.update({ where: { id: reviewId }, data: { staffResponse } });
}

module.exports = { createReview, updateReview, deleteReview, listRoomReviews, respondToReview };

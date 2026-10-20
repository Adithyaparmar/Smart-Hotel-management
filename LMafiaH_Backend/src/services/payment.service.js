const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const { getPaymentProvider, getPaymentProviderName } = require('./paymentProviders');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

/**
 * Frontend → Node backend → create Razorpay order → Razorpay → payment →
 * webhook → backend verification → PostgreSQL → booking confirmation.
 *
 * The backend never trusts a "payment succeeded" claim from the frontend by
 * itself — /verify re-derives the signature (or, for the mock provider, the
 * well-known mock convention) server-side before any booking is confirmed.
 */
async function createOrder(bookingId, requester) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');

  if (requester.role === 'CUSTOMER' && booking.customerId !== requester.id) {
    throw AppError.forbidden('You do not have access to this booking', 'FORBIDDEN_OWNERSHIP');
  }
  if (booking.status !== 'PENDING') {
    throw AppError.conflict(`Cannot create a payment order for a booking in status ${booking.status}`, 'INVALID_BOOKING_STATUS');
  }

  const provider = getPaymentProvider();
  const providerName = getPaymentProviderName();

  const { providerOrderId, raw } = await provider.createOrder({
    amount: Number(booking.totalAmount),
    currency: 'INR',
    receipt: booking.bookingNumber,
  });

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        bookingId, provider: providerName, amount: booking.totalAmount, currency: 'INR',
        status: 'CREATED', providerOrderId,
      },
    });
    await tx.paymentTransaction.create({
      data: { paymentId: created.id, type: 'ORDER_CREATED', rawPayload: raw },
    });
    return created;
  });

  return {
    paymentId: payment.id,
    providerOrderId,
    provider: providerName,
    amount: Number(booking.totalAmount),
    currency: 'INR',
    // Only the public key ever reaches the frontend — never the secret.
    razorpayKeyId: providerName === 'RAZORPAY' ? require('../config/env').razorpay.keyId : undefined,
  };
}

async function verifyPayment({ bookingId, providerOrderId, providerPaymentId, signature }, requester) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw AppError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
  if (requester.role === 'CUSTOMER' && booking.customerId !== requester.id) {
    throw AppError.forbidden('You do not have access to this booking', 'FORBIDDEN_OWNERSHIP');
  }

  const payment = await prisma.payment.findFirst({ where: { bookingId, providerOrderId } });
  if (!payment) throw AppError.notFound('Payment order not found', 'PAYMENT_NOT_FOUND');

  const provider = getPaymentProvider();
  const { verified, raw } = await provider.verifyPayment({ providerOrderId, providerPaymentId, signature });

  if (!verified) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', providerPaymentId } }),
      prisma.paymentTransaction.create({
        data: { paymentId: payment.id, type: 'VERIFICATION_FAILED', rawPayload: raw },
      }),
    ]);
    throw AppError.badRequest('Payment verification failed', 'PAYMENT_VERIFICATION_FAILED');
  }

  const bookingService = require('./booking.service'); // lazy require to avoid a cycle

  const updatedPayment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'CAPTURED', providerPaymentId },
    });
    await tx.paymentTransaction.create({
      data: { paymentId: payment.id, type: 'PAYMENT_CAPTURED', rawPayload: raw },
    });
    await bookingService.confirmBooking(bookingId, tx);
    return p;
  });

  await notificationService.notify({
    userId: booking.customerId,
    type: 'PAYMENT_CONFIRMATION',
    title: 'Payment received',
    message: `We've received your payment for ${booking.bookingNumber}. Grazie.`,
    channel: 'SOCKET',
    data: { bookingId, paymentId: payment.id },
  }).catch((err) => logger.warn(`Payment confirmation notification failed: ${err.message}`));

  return updatedPayment;
}

/** Razorpay webhook handler — a second, server-to-server confirmation path
 *  independent of the browser redirect, per Razorpay's recommended flow. */
async function handleWebhook(rawBody, signatureHeader) {
  const provider = getPaymentProvider();
  const valid = provider.verifyWebhookSignature(rawBody, signatureHeader);
  if (!valid) throw AppError.unauthorized('Invalid webhook signature', 'WEBHOOK_SIGNATURE_INVALID');

  const event = JSON.parse(rawBody.toString());
  const providerPaymentId = event?.payload?.payment?.entity?.id;
  const providerOrderId = event?.payload?.payment?.entity?.order_id;

  if (!providerOrderId) return { ignored: true };

  const payment = await prisma.payment.findFirst({ where: { providerOrderId } });
  if (!payment) return { ignored: true };

  await prisma.paymentTransaction.create({
    data: { paymentId: payment.id, type: 'WEBHOOK_RECEIVED', rawPayload: event },
  });

  if (event.event === 'payment.captured' && payment.status !== 'CAPTURED') {
    const bookingService = require('./booking.service');
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: 'CAPTURED', providerPaymentId } });
      await bookingService.confirmBooking(payment.bookingId, tx);
    });
  } else if (event.event === 'payment.failed') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
  }

  return { ok: true };
}

async function refundForCancelledBooking(bookingId, { fullRefund }) {
  const payment = await prisma.payment.findFirst({
    where: { bookingId, status: 'CAPTURED' },
    orderBy: { createdAt: 'desc' },
  });
  if (!payment) return null; // nothing was ever captured — nothing to refund

  const provider = getPaymentProvider();
  const refundAmount = fullRefund ? Number(payment.amount) : Number(payment.amount) * 0.5; // simple late-cancellation policy

  const { providerRefundId, raw } = await provider.refund({
    providerPaymentId: payment.providerPaymentId,
    amount: refundAmount,
  });

  return prisma.$transaction([
    prisma.refund.create({
      data: {
        paymentId: payment.id, amount: refundAmount, status: 'PROCESSED',
        providerRefundId, reason: fullRefund ? 'Full refund — within free cancellation window' : 'Partial refund — late cancellation',
      },
    }),
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: fullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
    }),
    prisma.paymentTransaction.create({ data: { paymentId: payment.id, type: 'VERIFICATION_SUCCESS', rawPayload: raw } }),
  ]);
}

module.exports = { createOrder, verifyPayment, handleWebhook, refundForCancelledBooking };

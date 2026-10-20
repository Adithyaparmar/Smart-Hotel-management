const crypto = require('crypto');
const PaymentProviderInterface = require('./provider.interface');

/**
 * Development-only provider used automatically when Razorpay credentials are
 * not configured. It never claims a real charge occurred — orders and
 * "payments" are clearly namespaced (mock_order_*, mock_pay_*) and no money
 * moves anywhere. This exists purely so the booking → payment → confirmation
 * flow is fully exercisable without live payment credentials.
 */
class MockPaymentProvider extends PaymentProviderInterface {
  async createOrder({ amount, currency = 'INR', receipt }) {
    const providerOrderId = `mock_order_${crypto.randomBytes(8).toString('hex')}`;
    return {
      providerOrderId,
      raw: { mock: true, amount, currency, receipt, note: 'No real payment gateway is configured.' },
    };
  }

  async verifyPayment({ providerOrderId, providerPaymentId }) {
    // Any providerPaymentId that follows the mock_pay_ convention "succeeds" —
    // this simulates the gateway's callback without contacting anything real.
    const verified = typeof providerPaymentId === 'string' && providerPaymentId.startsWith('mock_pay_');
    return { verified, raw: { mock: true, providerOrderId, providerPaymentId } };
  }

  async refund({ providerPaymentId, amount }) {
    return {
      providerRefundId: `mock_refund_${crypto.randomBytes(8).toString('hex')}`,
      raw: { mock: true, providerPaymentId, amount },
    };
  }

  verifyWebhookSignature() {
    return true; // mock provider has no real webhook secret to check
  }
}

module.exports = MockPaymentProvider;

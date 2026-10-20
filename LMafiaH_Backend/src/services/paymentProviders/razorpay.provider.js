const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../../config/env');
const PaymentProviderInterface = require('./provider.interface');

class RazorpayProvider extends PaymentProviderInterface {
  constructor() {
    super();
    this.client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }

  async createOrder({ amount, currency = 'INR', receipt }) {
    // Razorpay expects the amount in the smallest currency unit (paise).
    const order = await this.client.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      payment_capture: 1,
    });
    return { providerOrderId: order.id, raw: order };
  }

  async verifyPayment({ providerOrderId, providerPaymentId, signature }) {
    const expected = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(`${providerOrderId}|${providerPaymentId}`)
      .digest('hex');

    const verified = expected === signature;
    return { verified, raw: { expected, provided: signature } };
  }

  async refund({ providerPaymentId, amount }) {
    const refund = await this.client.payments.refund(providerPaymentId, {
      amount: amount != null ? Math.round(amount * 100) : undefined,
    });
    return { providerRefundId: refund.id, raw: refund };
  }

  verifyWebhookSignature(rawBody, signatureHeader) {
    const expected = crypto
      .createHmac('sha256', env.razorpay.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expected === signatureHeader;
  }
}

module.exports = RazorpayProvider;

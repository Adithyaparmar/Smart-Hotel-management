/**
 * Payment provider contract. Every concrete provider (Razorpay, Mock, ...)
 * implements this shape so payment.service.js never branches on provider
 * type outside of provider selection itself.
 *
 * createOrder({ amount, currency, receipt }) -> { providerOrderId, raw }
 * verifyPayment({ providerOrderId, providerPaymentId, signature }) -> { verified: boolean, raw }
 * refund({ providerPaymentId, amount }) -> { providerRefundId, raw }
 */
class PaymentProviderInterface {
  async createOrder(_params) { throw new Error('Not implemented'); }
  async verifyPayment(_params) { throw new Error('Not implemented'); }
  async refund(_params) { throw new Error('Not implemented'); }
  verifyWebhookSignature(_rawBody, _signatureHeader) { throw new Error('Not implemented'); }
}

module.exports = PaymentProviderInterface;

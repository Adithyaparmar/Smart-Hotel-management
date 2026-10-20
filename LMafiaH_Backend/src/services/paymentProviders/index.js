const env = require('../../config/env');
const RazorpayProvider = require('./razorpay.provider');
const MockPaymentProvider = require('./mock.provider');
const logger = require('../../utils/logger');

let instance;
let providerName;

/**
 * Provider selection happens once, at boot: Razorpay is used only when both
 * credentials are present; otherwise the app transparently falls back to the
 * mock provider so local development never silently fails on payments.
 */
function getPaymentProvider() {
  if (instance) return instance;

  if (env.razorpay.keyId && env.razorpay.keySecret) {
    instance = new RazorpayProvider();
    providerName = 'RAZORPAY';
    logger.info('Payment provider: Razorpay (live credentials detected)');
  } else {
    instance = new MockPaymentProvider();
    providerName = 'MOCK';
    logger.warn('Payment provider: MOCK — no Razorpay credentials found. No real payments will be processed.');
  }

  return instance;
}

function getPaymentProviderName() {
  getPaymentProvider();
  return providerName;
}

module.exports = { getPaymentProvider, getPaymentProviderName };

import api from './api'

export const paymentService = {
  async createOrder(bookingId) {
    const response = await api.post('/payments/create-order', {
      bookingId,
    })

    return response.data.data
  },

  async verifyPayment({ bookingId, providerOrderId, providerPaymentId, signature }) {
    const response = await api.post('/payments/verify', {
      bookingId,
      providerOrderId,
      providerPaymentId,
      ...(signature && { signature }),
    })

    return response.data.data
  },
}

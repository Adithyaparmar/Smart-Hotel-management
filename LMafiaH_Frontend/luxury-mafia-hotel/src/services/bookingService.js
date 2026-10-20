import api from './api'

export const bookingService = {
  async createBooking(payload) {
    const response = await api.post('/bookings', payload)
    return response.data.data
  },

  async listForCustomer() {
    const response = await api.get('/bookings/my')
    return response.data.data
  },

  async listAll() {
    const response = await api.get('/bookings')
    return response.data.data
  },

  async getById(id) {
    const response = await api.get(`/bookings/${id}`)
    return response.data.data
  },
}
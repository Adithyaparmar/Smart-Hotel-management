import api from './api'
import { payments } from '../data/people'
import {
  revenueTrend,
  occupancyTrend,
  roomPopularity,
  bookingSources,
} from '../data/analytics'

export const adminService = {
 
  async getOverview() {
  const response = await api.get('/admin/dashboard')
  const data = response.data.data

  return {
    kpis: {
      totalRooms: data.rooms.total,
      available: data.rooms.available,
      occupied: data.rooms.occupied,
      todayCheckIns: data.today.checkIns,
      todayCheckOuts: data.today.checkOuts,
      revenueMTD: data.revenue.monthToDate,
      occupancyRate: data.occupancyRate,
    },

    // Keep the existing chart presentation so the current UI
    // remains intact while the main KPI figures use live backend data.
    revenueTrend,
    occupancyTrend,
    roomPopularity,
    bookingSources,
  }
},

  async listRooms() {
  const response = await api.get('/rooms?isActive=true')
  const rooms = response.data.data

  const statusLabels = {
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    OCCUPIED: 'Occupied',
    CLEANING: 'Cleaning',
    MAINTENANCE: 'Maintenance',
  }

  return Array.isArray(rooms)
    ? rooms.map((room) => ({
        id: room.id,
        number: room.roomNumber,
        type: room.roomType?.name || room.name,
        category: room.roomType?.name || '',
        price: Number(
          room.price ?? room.roomType?.basePrice ?? 0
        ),
        status: statusLabels[room.status] || room.status,
        occupancy: room.status === 'OCCUPIED' ? 'Occupied' : '—',
      }))
    : []
},

  async updateRoomStatus(id, status, reason) {
    const response = await api.patch(`/rooms/${id}/status`, {
      status,
      reason,
    })

    return response.data.data
  },

  async createRoom(payload) {
    const response = await api.post('/rooms', payload)
    return response.data.data
  },

  async updateRoom(id, payload) {
    const response = await api.patch(`/rooms/${id}`, payload)
    return response.data.data
  },

  async deactivateRoom(id) {
    const response = await api.delete(`/rooms/${id}`)
    return response.data.data
  },

  async listBookings() {
    const response = await api.get('/bookings')
    const data = response.data.data

    return Array.isArray(data)
      ? data.map((booking) => ({
          id: booking.bookingNumber || booking.id,
          backendId: booking.id,

          guest: booking.customer
            ? `${booking.customer.firstName || ''} ${
                booking.customer.lastName || ''
              }`.trim()
            : 'Guest',

          roomName:
            booking.room?.name ||
            booking.room?.roomType?.name ||
            'Suite',

          checkIn: new Date(
            booking.checkInDate
          ).toLocaleDateString('en-IN'),

          checkOut: new Date(
            booking.checkOutDate
          ).toLocaleDateString('en-IN'),

          amount: Number(booking.totalAmount || 0),

          status:
            booking.status === 'CONFIRMED'
              ? 'Confirmed'
              : booking.status === 'PENDING'
                ? 'Pending'
                : booking.status === 'CHECKED_IN'
                  ? 'Checked-in'
                  : booking.status === 'CHECKED_OUT'
                    ? 'Checked-out'
                    : booking.status === 'CANCELLED'
                      ? 'Cancelled'
                      : booking.status,

          payment:
            booking.status === 'CANCELLED'
              ? 'Refunded'
              : booking.status === 'PENDING'
                ? 'Awaiting Payment'
                : 'Paid',
        }))
      : []
  },

  async cancelBooking(id, reason) {
    const response = await api.patch(`/bookings/${id}/cancel`, {
      reason,
    })

    return response.data.data
  },

  async checkIn(id) {
    const response = await api.post(`/bookings/${id}/check-in`)
    return response.data.data
  },

  async checkOut(id) {
    const response = await api.post(`/bookings/${id}/check-out`)
    return response.data.data
  },

  async listCustomers() {
    const response = await api.get('/admin/customers')
    const data = response.data.data

    return Array.isArray(data)
      ? data.map((customer) => ({
          id: customer.id,

          name: `${customer.firstName || ''} ${
            customer.lastName || ''
          }`.trim(),

          email: customer.email,

          phone: customer.phone || '—',

          memberSince: new Date(
            customer.createdAt
          ).toLocaleDateString('en-IN'),

          tier: 'New Member',

          stays: 0,

          lifetimeValue: 0,

          isActive: customer.isActive,
        }))
      : []
  },

  async updateCustomerStatus(id, isActive) {
    const response = await api.patch(`/admin/customers/${id}/status`, {
      isActive,
    })

    return response.data.data
  },

  async listStaff() {
    const response = await api.get('/staff')
    const data = response.data.data

    return Array.isArray(data)
      ? data.map((member) => ({
          id: member.id,

          name: `${member.firstName || ''} ${
            member.lastName || ''
          }`.trim(),

          department:
            member.staffProfile?.department || '—',

          role:
            member.staffProfile?.position ||
            member.role ||
            '—',

          status: member.isActive ? 'On Duty' : 'Off Duty',

          tasksAssigned: 0,
        }))
      : []
  },

  async createStaff(payload) {
    const response = await api.post('/staff', payload)
    return response.data.data
  },

  async listTasks(params = {}) {
    const response = await api.get('/staff/tasks', {
      params,
    })

    return response.data.data
  },

  async createTask(payload) {
    const response = await api.post('/staff/tasks', payload)
    return response.data.data
  },

  async updateTask(id, payload) {
    const response = await api.patch(`/staff/tasks/${id}`, payload)
    return response.data.data
  },

  async getStaffDashboard() {
    const response = await api.get('/staff/dashboard')
    return response.data.data
  },

  async getTodaysCheckIns() {
    const response = await api.get('/staff/check-ins/today')
    return response.data.data
  },

  async getTodaysCheckOuts() {
    const response = await api.get('/staff/check-outs/today')
    return response.data.data
  },

  async listPayments() {
    return payments
  },
}
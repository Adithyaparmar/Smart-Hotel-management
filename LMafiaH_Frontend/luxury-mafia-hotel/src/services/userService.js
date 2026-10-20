// Mock user service. Replace with: GET/PUT /api/users/me
import { customers } from '../data/people'

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export const userService = {
  async getProfile() {
    await delay()
    return customers[0]
  },
  async updateProfile(payload) {
    await delay(700)
    return { ...customers[0], ...payload }
  },
}

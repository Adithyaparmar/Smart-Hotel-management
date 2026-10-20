import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url === '/auth/refresh'
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const refreshResponse = await api.post('/auth/refresh')

      const { user, accessToken } = refreshResponse.data.data

      localStorage.setItem('accessToken', accessToken)

      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`

      return api(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')

      return Promise.reject(refreshError)
    }
  }
)

export default api
import { createContext, useContext, useState, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [status, setStatus] = useState('idle')

  const login = useCallback(async (credentials) => {
    setStatus('loading')

    try {
      const result = await authService.login(credentials)

      setUser(result)
      localStorage.setItem('user', JSON.stringify(result))

      setStatus('idle')

      return { ok: true, user: result }
    } catch (err) {
      setStatus('error')

      return {
        ok: false,
        error:
          err.response?.data?.message ||
          err.message ||
          'Login failed.',
      }
    }
  }, [])

  const register = useCallback(async (payload) => {
    setStatus('loading')

    try {
      const result = await authService.register(payload)

      setUser(result)
      localStorage.setItem('user', JSON.stringify(result))

      setStatus('idle')

      return { ok: true, user: result }
    } catch (err) {
      setStatus('error')

      return {
        ok: false,
        error:
          err.response?.data?.message ||
          err.message ||
          'Registration failed.',
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Clear local session even if backend logout fails
    }

    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')

    setUser(null)
    setStatus('idle')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}

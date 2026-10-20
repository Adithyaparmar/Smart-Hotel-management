import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Input } from '../components/common/FormElements'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(form)
    if (result.ok) navigate('/dashboard')
    else setError(result.error)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <img
        src="https://images.unsplash.com/photo-1611048268330-53de574cae3b?q=80&w=2000&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/90 to-obsidian" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center">
          <Link to="/" className="font-display text-xl text-ivory">
            LUXURY <span className="text-gold">MAFIA</span> HOTEL
          </Link>
          <h1 className="display-md mt-6">Welcome back.</h1>
          <p className="mt-2 font-body text-sm text-ivory/45">Sign in to your private portal.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          {error && <p className="font-body text-xs text-red-400">{error}</p>}

          <div className="flex items-center justify-between font-body text-xs">
            <label className="flex items-center gap-2 text-ivory/50">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                className="h-3.5 w-3.5 accent-[#C6A664]"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-gold hover:text-ivory">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center font-body text-xs text-ivory/40">
          New to the house?{' '}
          <Link to="/register" className="text-gold hover:text-ivory">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Input } from '../components/common/FormElements'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const next = {}
    if (!form.fullName) next.fullName = 'Full name is required.'
    if (!form.email) next.email = 'Email is required.'
    if (!form.phone) next.phone = 'Phone number is required.'
    if (!form.password || form.password.length < 8)
      next.password = 'Password must be at least 8 characters.'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await register(form)
    if (result.ok) navigate('/dashboard')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <img
        src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2000&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25"
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
          <h1 className="display-md mt-6">Request membership.</h1>
          <p className="mt-2 font-body text-sm text-ivory/45">Create your private account.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <Input
            label="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            error={errors.fullName}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />

          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center font-body text-xs text-ivory/40">
          Already a member?{' '}
          <Link to="/login" className="text-gold hover:text-ivory">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

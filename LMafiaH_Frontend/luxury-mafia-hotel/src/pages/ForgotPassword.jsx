import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, MailCheck } from 'lucide-react'
import { Input } from '../components/common/FormElements'
import { authService } from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    await authService.forgotPassword(email)
    setStatus('idle')
    setSent(true)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-graphite to-obsidian" />

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
          <h1 className="display-md mt-6">Reset your password.</h1>
          <p className="mt-2 font-body text-sm text-ivory/45">
            We will send a reset link to your registered email.
          </p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex flex-col items-center gap-4 border border-gold/20 bg-gold/5 p-8 text-center"
          >
            <MailCheck className="h-6 w-6 text-gold" />
            <p className="font-body text-sm text-ivory/70">
              If an account exists for <span className="text-ivory">{email}</span>, a reset link is on its
              way.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
              {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center font-body text-xs text-ivory/40">
          <Link to="/login" className="text-gold hover:text-ivory">
            Return to login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

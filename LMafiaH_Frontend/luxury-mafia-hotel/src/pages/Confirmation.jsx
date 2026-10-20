import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Download, LayoutDashboard, Home as HomeIcon } from 'lucide-react'
import { useBooking } from '../context/BookingContext'

export default function Confirmation() {
  const { confirmation, selectedRoom, guestDetails, nights, search, reset } = useBooking()
  const navigate = useNavigate()

  useEffect(() => {
    if (!confirmation) navigate('/booking')
  }, [confirmation, navigate])

  if (!confirmation || !selectedRoom) return null

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-6 pt-24 text-center lg:px-10">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-16 w-16 items-center justify-center rounded-full border border-gold bg-gold/10"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Check className="h-7 w-7 text-gold" />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="display-lg mt-8"
      >
        Your stay is reserved.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-3 font-body text-sm text-ivory/50"
      >
        A confirmation has been sent to {guestDetails.email}.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="card-surface mt-10 w-full p-8 text-left"
      >
        <div className="flex items-center justify-between border-b border-ivory/10 pb-5">
          <span className="font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
            Confirmation Number
          </span>
          <span className="font-display text-lg text-gold">{confirmation.confirmationNumber}</span>
        </div>
        <div className="grid grid-cols-2 gap-6 pt-5 font-body text-sm">
          <div>
            <p className="text-ivory/40">Suite</p>
            <p className="mt-1 text-ivory/85">{selectedRoom.name}</p>
          </div>
          <div>
            <p className="text-ivory/40">Guest</p>
            <p className="mt-1 text-ivory/85">{guestDetails.fullName}</p>
          </div>
          <div>
            <p className="text-ivory/40">Dates</p>
            <p className="mt-1 text-ivory/85">
              {search.checkIn || 'TBC'} → {search.checkOut || 'TBC'}
            </p>
          </div>
          <div>
            <p className="text-ivory/40">Total Paid</p>
            <p className="mt-1 text-gold">
              {selectedRoom.currency}
              {confirmation.total?.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.6 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link to="/dashboard/bookings" className="btn-outline">
          <LayoutDashboard className="h-3.5 w-3.5" /> View Booking
        </Link>
        <button onClick={() => window.print()} className="btn-outline">
          <Download className="h-3.5 w-3.5" /> Download Summary
        </button>
        <Link to="/" onClick={reset} className="btn-primary">
          <HomeIcon className="h-3.5 w-3.5" /> Return Home
        </Link>
      </motion.div>
    </div>
  )
}

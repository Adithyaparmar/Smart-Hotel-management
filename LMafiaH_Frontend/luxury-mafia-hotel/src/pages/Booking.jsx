import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Input } from '../components/common/FormElements'
import { RoomGrid } from '../components/rooms/RoomGrid'
import { roomService } from '../services/roomService'
import { useBooking } from '../context/BookingContext'

const steps = ['Room', 'Guest Details', 'Review']

function StepIndicator({ current }) {
  return (
    <div className="mb-12 flex items-center gap-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border font-body text-xs ${
              i <= current ? 'border-gold bg-gold/10 text-gold' : 'border-ivory/20 text-ivory/40'
            }`}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={`font-body text-xs uppercase tracking-widest2 ${i <= current ? 'text-ivory' : 'text-ivory/35'}`}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="mx-2 h-px w-10 bg-ivory/15" />}
        </div>
      ))}
    </div>
  )
}

export default function Booking() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { selectedRoom, setSelectedRoom, guestDetails, setGuestDetails, search, nights } = useBooking()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [bookingRooms, setBookingRooms] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [roomsError, setRoomsError] = useState('')

  useEffect(() => {
  const roomId = params.get('roomId')

  if (!roomId) return

  let cancelled = false

  const loadRoom = async () => {
    try {
      const room = await roomService.getById(roomId)

      if (!cancelled) {
        setSelectedRoom(room)
        setStep(1)
      }
    } catch (error) {
      console.error('Failed to load booking room:', error)
    }
  }

  loadRoom()

  return () => {
    cancelled = true
  }
}, [params, setSelectedRoom])

useEffect(() => {
  let cancelled = false

  const loadRooms = async () => {
    try {
      const result = await roomService.list()

      if (!cancelled) {
        setBookingRooms(result)
      }
    } catch (error) {
      console.error('Failed to load booking rooms:', error)
    } finally {
      if (!cancelled) {
        setRoomsLoading(false)
      }
    }
  }

  loadRooms()

  return () => {
    cancelled = true
  }
}, [])

  const validateGuestDetails = () => {
    const next = {}
    if (!guestDetails.fullName) next.fullName = 'Full name is required.'
    if (!guestDetails.email) next.email = 'Email is required.'
    if (!guestDetails.phone) next.phone = 'Phone number is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    if (step === 0 && !selectedRoom) return
    if (step === 1 && !validateGuestDetails()) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const taxes = selectedRoom ? Math.round(selectedRoom.price * nights * 0.12) : 0
  const subtotal = selectedRoom ? selectedRoom.price * nights : 0
  const total = subtotal + taxes

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-32 lg:px-10">
      <span className="eyebrow">Reservation</span>
      <h1 className="display-md mt-2 mb-10">Complete your booking.</h1>

      <StepIndicator current={step} />

      {step === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="mb-6 font-body text-sm text-ivory/50">Select the suite for your stay.</p>
          {roomsLoading ? (
  <p className="font-body text-sm text-ivory/50">Loading suites...</p>
) : (
  <RoomGrid rooms={bookingRooms} />
)}
          {selectedRoom && (
            <div className="mt-10 flex justify-end">
              <button onClick={goNext} className="btn-primary">
                Continue
              </button>
            </div>
          )}
        </motion.div>
      )}

      {step === 1 && selectedRoom && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Input
              label="Full Name"
              value={guestDetails.fullName}
              onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })}
              error={errors.fullName}
              placeholder="As it appears on your ID"
            />
            <Input
              label="Email"
              type="email"
              value={guestDetails.email}
              onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
              error={errors.email}
              placeholder="you@example.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={guestDetails.phone}
              onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
              error={errors.phone}
              placeholder="+91 00000 00000"
            />
            <Input
              label="Guests"
              type="number"
              min={1}
              max={selectedRoom.capacity}
              value={guestDetails.guests}
              onChange={(e) => setGuestDetails({ ...guestDetails, guests: Number(e.target.value) })}
            />
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(0)} className="btn-ghost">
                Back
              </button>
              <button onClick={goNext} className="btn-primary">
                Continue to Review
              </button>
            </div>
          </div>
          <BookingSummary room={selectedRoom} nights={nights} subtotal={subtotal} taxes={taxes} total={total} />
        </motion.div>
      )}

      {step === 2 && selectedRoom && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="card-surface space-y-6 p-7">
            <div>
              <p className="eyebrow mb-2">Guest</p>
              <p className="font-body text-sm text-ivory/80">{guestDetails.fullName}</p>
              <p className="font-body text-xs text-ivory/45">{guestDetails.email} · {guestDetails.phone}</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Stay</p>
              <p className="font-body text-sm text-ivory/80">
                {search.checkIn || 'Dates to be confirmed'} → {search.checkOut || ''}
              </p>
              <p className="font-body text-xs text-ivory/45">{nights} nights · {guestDetails.guests} guests</p>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="btn-ghost">
                Back
              </button>
              <Link to="/booking/payment" className="btn-primary">
                Proceed to Payment
              </Link>
            </div>
          </div>
          <BookingSummary room={selectedRoom} nights={nights} subtotal={subtotal} taxes={taxes} total={total} />
        </motion.div>
      )}
    </div>
  )
}

function BookingSummary({ room, nights, subtotal, taxes, total }) {
  return (
    <aside className="h-fit card-surface p-6">
      <img src={room.images[0]} alt={room.name} className="mb-4 aspect-video w-full object-cover" />
      <p className="font-body text-[11px] uppercase tracking-widest2 text-gold/80">{room.category}</p>
      <p className="font-display text-xl text-ivory">{room.name}</p>
      <div className="mt-5 space-y-2.5 border-t border-ivory/10 pt-5 font-body text-sm text-ivory/60">
        <div className="flex justify-between">
          <span>Room ({nights} nights)</span>
          <span>{room.currency}{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxes &amp; fees</span>
          <span>{room.currency}{taxes.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between border-t border-ivory/10 pt-2.5 font-display text-base text-ivory">
          <span>Total</span>
          <span className="text-gold">{room.currency}{total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </aside>
  )
}

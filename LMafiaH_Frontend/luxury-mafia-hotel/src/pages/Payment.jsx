import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Smartphone, Landmark, Wallet, Loader2, ShieldCheck } from 'lucide-react'
import { Input } from '../components/common/FormElements'
import { useBooking } from '../context/BookingContext'
import { paymentService } from '../services/paymentService'
import { bookingService } from '../services/bookingService'

const methods = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
]

export default function Payment() {
  const navigate = useNavigate()
  const { selectedRoom, guestDetails, nights, paymentMethod, setPaymentMethod, setConfirmation, search } =
    useBooking()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!selectedRoom) navigate('/booking')
  }, [selectedRoom, navigate])

  if (!selectedRoom) return null

  const taxes = Math.round(selectedRoom.price * nights * 0.12)
  const total = selectedRoom.price * nights + taxes

  const handlePay = async (e) => {
  e.preventDefault()
  setProcessing(true)

  try {
    const booking = await bookingService.createBooking({
      roomId: selectedRoom.backendId,
      checkInDate: search.checkIn,
      checkOutDate: search.checkOut,
      numAdults: guestDetails.guests,
      numChildren: 0,
      guests: [
        {
          fullName: guestDetails.fullName,
        },
      ],
    })

    const order = await paymentService.createOrder(booking.id)

    const payment = await paymentService.verifyPayment({
      bookingId: booking.id,
      providerOrderId: order.providerOrderId,
      providerPaymentId: `mock_pay_${Date.now()}`,
    })

    setConfirmation({
      ...booking,
      payment,
    })

    navigate('/booking/confirmation')
  } catch (error) {
    console.error('Booking/payment failed:', error)
    alert(error.response?.data?.message || error.message || 'Unable to complete booking.')
  } finally {
    setProcessing(false)
  }
}

  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-32 lg:px-10">
      <span className="eyebrow">Secure Payment</span>
      <h1 className="display-md mt-2 mb-10">How would you like to pay?</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
        <form onSubmit={handlePay} className="space-y-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {methods.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                data-cursor="button"
                className={`flex flex-col items-center gap-2.5 border px-4 py-5 transition-colors ${
                  paymentMethod === m.id ? 'border-gold bg-gold/5' : 'border-ivory/15 hover:border-ivory/30'
                }`}
              >
                <m.icon className={`h-5 w-5 ${paymentMethod === m.id ? 'text-gold' : 'text-ivory/50'}`} />
                <span className="font-body text-xs text-ivory/70">{m.label}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'card' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Input label="Card Number" placeholder="4242 4242 4242 4242" required />
              <div className="grid grid-cols-2 gap-5">
                <Input label="Expiry" placeholder="MM / YY" required />
                <Input label="CVV" placeholder="123" required />
              </div>
              <Input label="Name on Card" placeholder={guestDetails.fullName || 'Full name'} required />
            </motion.div>
          )}
          {paymentMethod === 'upi' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Input label="UPI ID" placeholder="yourname@upi" required />
            </motion.div>
          )}
          {paymentMethod === 'netbanking' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Input label="Bank Name" placeholder="Select your bank" required />
            </motion.div>
          )}
          {paymentMethod === 'wallet' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Input label="Wallet ID / Number" placeholder="Linked wallet" required />
            </motion.div>
          )}

          <div className="flex items-center gap-2 font-body text-xs text-ivory/40">
            <ShieldCheck className="h-4 w-4 text-gold" />
            This is a demo payment flow. No real transaction will be processed.
          </div>

          <button type="submit" data-cursor="button" disabled={processing} className="btn-primary w-full">
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing Payment
              </>
            ) : (
              `Pay ${selectedRoom.currency}${total.toLocaleString('en-IN')}`
            )}
          </button>
        </form>

        <aside className="h-fit card-surface p-6">
          <p className="font-display text-lg text-ivory">{selectedRoom.name}</p>
          <p className="font-body text-xs text-ivory/45">{nights} nights · {guestDetails.guests || 1} guests</p>
          <div className="mt-5 space-y-2.5 border-t border-ivory/10 pt-5 font-body text-sm text-ivory/60">
            <div className="flex justify-between">
              <span>Room total</span>
              <span>{selectedRoom.currency}{(selectedRoom.price * nights).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes &amp; fees</span>
              <span>{selectedRoom.currency}{taxes.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between border-t border-ivory/10 pt-2.5 font-display text-base text-ivory">
              <span>Total</span>
              <span className="text-gold">{selectedRoom.currency}{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

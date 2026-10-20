import { useEffect, useState } from 'react'
import { Badge } from '../../components/common/FormElements'
import { DataTable } from '../../components/dashboard/DashboardWidgets'
import { LoadingState } from '../../components/common/States'
import { bookingService } from '../../services/bookingService'

const tabs = ['Upcoming', 'Active', 'Past', 'Cancelled']

const statusToTab = {
  CONFIRMED: 'Upcoming',
  PENDING: 'Upcoming',
  CHECKED_IN: 'Active',
  CHECKED_OUT: 'Past',
  CANCELLED: 'Cancelled',
}

const statusLabel = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CHECKED_IN: 'Checked-in',
  CHECKED_OUT: 'Checked-out',
  CANCELLED: 'Cancelled',
}

const statusTone = {
  CONFIRMED: 'success',
  PENDING: 'warning',
  CHECKED_IN: 'signal',
  CHECKED_OUT: 'neutral',
  CANCELLED: 'danger',
}

const columns = [
  { key: 'roomName', label: 'Room' },
  { key: 'checkIn', label: 'Check-in' },
  { key: 'checkOut', label: 'Check-out' },
  { key: 'guests', label: 'Guests' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
]

function adaptBooking(booking) {
  return {
    id: booking.id,
    roomName: booking.room?.name || booking.room?.roomType?.name || 'Suite',
    checkIn: new Date(booking.checkInDate).toLocaleDateString('en-IN'),
    checkOut: new Date(booking.checkOutDate).toLocaleDateString('en-IN'),
    guests: Number(booking.numAdults || 0) + Number(booking.numChildren || 0),
    amount: Number(booking.totalAmount || 0),
    status: booking.status,
  }
}

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Upcoming')

  useEffect(() => {
    let cancelled = false

    const loadBookings = async () => {
      try {
        setError('')
        const data = await bookingService.listForCustomer()

        if (!cancelled) {
          setBookings(Array.isArray(data) ? data.map(adaptBooking) : [])
        }
      } catch (err) {
        console.error('Failed to load customer bookings:', err)

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Unable to load your bookings.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBookings()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <LoadingState label="Loading your bookings." />

  if (error) {
    return (
      <div className="card-surface p-6">
        <p className="font-body text-sm text-red-400">{error}</p>
      </div>
    )
  }

  const filtered = bookings.filter((b) => statusToTab[b.status] === tab)

  return (
    <div>
      <div className="mb-8 flex gap-1 border-b border-ivory/10">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 font-body text-xs uppercase tracking-widest2 transition-colors ${
              tab === t
                ? 'border-b-2 border-gold text-gold'
                : 'text-ivory/40 hover:text-ivory/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <DataTable
          columns={columns}
          rows={filtered}
          emptyLabel={`No ${tab.toLowerCase()} bookings.`}
          renderCell={(row, key) => {
            if (key === 'amount') {
              return `₹${row.amount.toLocaleString('en-IN')}`
            }

            if (key === 'status') {
              return (
                <Badge tone={statusTone[row.status]}>
                  {statusLabel[row.status] || row.status}
                </Badge>
              )
            }

            return row[key]
          }}
        />
      </div>
    </div>
  )
}
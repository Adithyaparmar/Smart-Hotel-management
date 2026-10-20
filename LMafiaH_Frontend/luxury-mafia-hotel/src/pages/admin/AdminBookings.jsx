import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DataTable } from '../../components/dashboard/DashboardWidgets'
import { Badge, Input, Select } from '../../components/common/FormElements'
import { LoadingState, EmptyState } from '../../components/common/States'
import { adminService } from '../../services/adminService'

const statusTone = {
  Confirmed: 'gold',
  'Checked-in': 'success',
  'Checked-out': 'neutral',
  Pending: 'warning',
  Cancelled: 'danger',
}

const paymentTone = {
  Paid: 'success',
  'Awaiting Payment': 'warning',
  Refunded: 'neutral',
}

const nextAction = {
  Confirmed: { label: 'Check-in' },
  'Checked-in': { label: 'Check-out' },
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  useEffect(() => {
    adminService.listBookings().then(setBookings)
  }, [])

  const filtered = useMemo(() => {
    if (!bookings) return []
    return bookings.filter((b) => {
      const matchesQuery =
        !query ||
        b.guest.toLowerCase().includes(query.toLowerCase()) ||
        b.id.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'All Statuses' || b.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [bookings, query, statusFilter])

   const advance = async (booking) => {
   const action = nextAction[booking.status]

    if (!action) return

   try {
    let updated

    if (booking.status === 'Confirmed') {
      updated = await adminService.checkIn(booking.backendId)
    } else if (booking.status === 'Checked-in') {
      updated = await adminService.checkOut(booking.backendId)
    } else {
      return
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? {
    ...b,
    status:
      updated.status === 'CHECKED_IN'
        ? 'Checked-in'
        : updated.status === 'CHECKED_OUT'
          ? 'Checked-out'
          : updated.status === 'CONFIRMED'
            ? 'Confirmed'
            : updated.status === 'CANCELLED'
              ? 'Cancelled'
              : updated.status,
  }
          : b
      )
    )
  } catch (error) {
    console.error('Failed to update booking status:', error)
    alert(
      error.response?.data?.message ||
        error.message ||
        'Unable to update booking status.'
    )
  }
}

  const cancel = async (booking) => {
  try {
    const updated = await adminService.cancelBooking(
      booking.backendId,
      'Cancelled by admin'
    )

    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? { ...b, status: updated.status }
          : b
      )
    )
  } catch (error) {
    console.error('Failed to cancel booking:', error)
    alert(
      error.response?.data?.message ||
        error.message ||
        'Unable to cancel booking.'
    )
  }
}

  if (!bookings) return <LoadingState label="Loading reservations." />

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">House Operations</span>
        <h1 className="display-md mt-2">Reservations</h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
          <Input
            placeholder="Search guest or booking ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[220px]">
          <option>All Statuses</option>
          {['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No reservations found." description="Adjust your search or status filter." />
      ) : (
        <div className="card-surface p-2">
          <DataTable
            columns={[
              { key: 'id', label: 'Booking' },
              { key: 'guest', label: 'Guest' },
              { key: 'roomName', label: 'Suite' },
              { key: 'dates', label: 'Dates' },
              { key: 'amount', label: 'Amount' },
              { key: 'status', label: 'Status' },
              { key: 'payment', label: 'Payment' },
              { key: 'actions', label: '' },
            ]}
            rows={filtered}
            renderCell={(row, key) => {
              if (key === 'dates') return `${row.checkIn} → ${row.checkOut}`
              if (key === 'amount') return `₹${row.amount.toLocaleString('en-IN')}`
              if (key === 'status') return <Badge tone={statusTone[row.status]}>{row.status}</Badge>
              if (key === 'payment') return <Badge tone={paymentTone[row.payment] || 'neutral'}>{row.payment}</Badge>
              if (key === 'actions') {
                const action = nextAction[row.status]
                return (
                  <div className="flex items-center gap-4 font-body text-[11px] uppercase tracking-widest2">
                    <button className="text-ivory/50 hover:text-gold">View</button>
                    {action && (
                      <button className="text-gold hover:text-ivory" onClick={() => advance(row)}>
                        {action.label}
                      </button>
                    )}
                    {row.status !== 'Cancelled' && row.status !== 'Checked-out' && (
                      <button className="text-red-400/70 hover:text-red-400" onClick={() => cancel(row)}>
                        Cancel
                      </button>
                    )}
                  </div>
                )
              }
              return row[key]
            }}
          />
        </div>
      )}
    </div>
  )
}

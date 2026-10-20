import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DataTable } from '../../components/dashboard/DashboardWidgets'
import { Badge, Input } from '../../components/common/FormElements'
import { LoadingState, EmptyState } from '../../components/common/States'
import Modal from '../../components/common/Modal'
import { adminService } from '../../services/adminService'
import { bookings } from '../../data/bookings'

const tierTone = {
  'Black Label Member': 'gold',
  'Gold Member': 'signal',
  'New Member': 'neutral',
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    adminService.listCustomers().then(setCustomers)
  }, [])

  const filtered = useMemo(() => {
    if (!customers) return []
    return customers.filter(
      (c) =>
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
    )
  }, [customers, query])

  const history = selected ? bookings.filter((b) => b.guest === selected.name) : []

  if (!customers) return <LoadingState label="Loading guest records." />

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">House Operations</span>
        <h1 className="display-md mt-2">Customers</h1>
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/30" />
        <Input
          placeholder="Search name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No guests match your search." />
      ) : (
        <div className="card-surface p-2">
          <DataTable
            columns={[
              { key: 'name', label: 'Guest' },
              { key: 'email', label: 'Email' },
              { key: 'stays', label: 'Stays' },
              { key: 'lifetimeValue', label: 'Lifetime Value' },
              { key: 'tier', label: 'Tier' },
              { key: 'actions', label: '' },
            ]}
            rows={filtered}
            renderCell={(row, key) => {
              if (key === 'lifetimeValue') return `₹${row.lifetimeValue.toLocaleString('en-IN')}`
              if (key === 'tier') return <Badge tone={tierTone[row.tier] || 'neutral'}>{row.tier}</Badge>
              if (key === 'actions')
                return (
                  <button
                    className="font-body text-[11px] uppercase tracking-widest2 text-gold hover:text-ivory"
                    onClick={() => setSelected(row)}
                  >
                    View Profile
                  </button>
                )
              return row[key]
            }}
          />
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest2 text-ivory/40">Email</p>
                <p className="mt-1 font-body text-sm text-ivory/80">{selected.email}</p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest2 text-ivory/40">Phone</p>
                <p className="mt-1 font-body text-sm text-ivory/80">{selected.phone}</p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest2 text-ivory/40">Member Since</p>
                <p className="mt-1 font-body text-sm text-ivory/80">{selected.memberSince}</p>
              </div>
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest2 text-ivory/40">Tier</p>
                <Badge tone={tierTone[selected.tier] || 'neutral'} className="mt-1">
                  {selected.tier}
                </Badge>
              </div>
            </div>
            <div>
              <p className="mb-3 font-display text-lg text-ivory">Booking History</p>
              {history.length === 0 ? (
                <p className="font-body text-sm text-ivory/40">No bookings on file for this guest yet.</p>
              ) : (
                <ul className="divide-y divide-ivory/10">
                  {history.map((b) => (
                    <li key={b.id} className="flex items-center justify-between py-3 font-body text-sm text-ivory/70">
                      <span>{b.roomName}</span>
                      <span className="text-ivory/40">
                        {b.checkIn} → {b.checkOut}
                      </span>
                      <span className="text-gold">₹{b.amount.toLocaleString('en-IN')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

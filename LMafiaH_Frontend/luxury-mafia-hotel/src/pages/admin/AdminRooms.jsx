import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Eye, RefreshCcw } from 'lucide-react'
import { DataTable } from '../../components/dashboard/DashboardWidgets'
import { Badge, Button, Input, Select } from '../../components/common/FormElements'
import { LoadingState, EmptyState } from '../../components/common/States'
import Modal from '../../components/common/Modal'
import { adminService } from '../../services/adminService'

const statuses = ['Available', 'Reserved', 'Occupied', 'Cleaning', 'Maintenance']
const statusTone = {
  Available: 'success',
  Reserved: 'gold',
  Occupied: 'burgundy',
  Cleaning: 'signal',
  Maintenance: 'warning',
}

// Suite categories only model room *types*. For an operations view we
// synthesize a small set of numbered instances per type — this is the
// kind of per-room inventory a real PostgreSQL `rooms` table would hold.
function buildInventory(roomTypes) {
  const floors = [2, 3, 4, 5, 6]
  let cursor = 0
  return roomTypes.flatMap((type, typeIdx) =>
    Array.from({ length: typeIdx === roomTypes.length - 1 ? 1 : 3 }).map((_, i) => {
      cursor += 1
      const floor = floors[cursor % floors.length]
      return {
        id: `${type.id}-${floor}0${i + 1}`,
        number: `${floor}0${i + 1}`,
        type: type.name,
        category: type.category,
        price: type.price,
        status: statuses[cursor % statuses.length],
        occupancy: statuses[cursor % statuses.length] === 'Occupied' ? `${1 + (cursor % type.capacity)}/${type.capacity}` : '—',
      }
    })
  )
}

export default function AdminRooms() {
  const [inventory, setInventory] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)

  useEffect(() => {
  adminService.listRooms().then(setInventory)
}, [])

  const filtered = useMemo(() => {
    if (!inventory) return []
    return inventory.filter((r) => {
      const matchesQuery =
        !query ||
        r.type.toLowerCase().includes(query.toLowerCase()) ||
        r.number.includes(query)
      const matchesStatus = statusFilter === 'All Statuses' || r.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [inventory, query, statusFilter])

  const cycleStatus = (roomId) => {
    setInventory((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, status: statuses[(statuses.indexOf(r.status) + 1) % statuses.length] }
          : r
      )
    )
  }

  if (!inventory) return <LoadingState label="Loading room inventory." />

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">House Operations</span>
          <h1 className="display-md mt-2">Rooms</h1>
        </div>
        <Button
          onClick={() => {
            setEditingRoom(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Add Room
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by suite or room number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[220px]">
          <option>All Statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No rooms match your filters." description="Try clearing search or status filters." />
      ) : (
        <div className="card-surface p-2">
          <DataTable
            columns={[
              { key: 'number', label: 'Room' },
              { key: 'type', label: 'Suite Type' },
              { key: 'price', label: 'Rate / Night' },
              { key: 'occupancy', label: 'Occupancy' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '' },
            ]}
            rows={filtered}
            renderCell={(row, key) => {
              if (key === 'price') return `₹${row.price.toLocaleString('en-IN')}`
              if (key === 'status')
                return (
                  <button onClick={() => cycleStatus(row.id)} data-cursor="button">
                    <Badge tone={statusTone[row.status]}>{row.status}</Badge>
                  </button>
                )
              if (key === 'actions')
                return (
                  <div className="flex items-center gap-3 text-ivory/50">
                    <button
                      aria-label={`Edit ${row.number}`}
                      className="hover:text-gold"
                      onClick={() => {
                        setEditingRoom(row)
                        setModalOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button aria-label={`View ${row.number}`} className="hover:text-gold">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Change status of ${row.number}`}
                      className="hover:text-gold"
                      onClick={() => cycleStatus(row.id)}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                  </div>
                )
              return row[key]
            }}
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? `Edit Room ${editingRoom.number}` : 'Add Room'}
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            setModalOpen(false)
          }}
        >
          <Input label="Room Number" name="number" defaultValue={editingRoom?.number} placeholder="e.g. 512" required />
          <Select label="Suite Type" name="type" defaultValue={editingRoom?.type}>
            {inventory
              .map((r) => r.type)
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </Select>
          <Input
            label="Rate / Night (₹)"
            name="price"
            type="number"
            defaultValue={editingRoom?.price}
            required
          />
          <Select label="Status" name="status" defaultValue={editingRoom?.status || 'Available'}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingRoom ? 'Save Changes' : 'Add Room'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

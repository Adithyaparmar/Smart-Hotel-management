import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { DataTable } from '../../components/dashboard/DashboardWidgets'
import { Badge, Button, Input, Select } from '../../components/common/FormElements'
import { LoadingState } from '../../components/common/States'
import Modal from '../../components/common/Modal'
import { adminService } from '../../services/adminService'

const statusTone = {
  'On Duty': 'success',
  'Off Duty': 'neutral',
  'On Leave': 'warning',
}

const departments = ['Front of House', 'Housekeeping', 'Culinary', 'Concierge', 'Spa & Wellness', 'Security', 'Management']

export default function AdminStaff() {
  const [staff, setStaff] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    adminService.listStaff().then(setStaff)
  }, [])

  if (!staff) return <LoadingState label="Loading staff roster." />

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">House Operations</span>
          <h1 className="display-md mt-2">Staff</h1>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card-surface p-6">
          <p className="font-body text-[11px] uppercase tracking-widest2 text-ivory/45">On Duty Now</p>
          <p className="mt-3 font-display text-3xl text-ivory">
            {staff.filter((s) => s.status === 'On Duty').length}
          </p>
        </div>
        <div className="card-surface p-6">
          <p className="font-body text-[11px] uppercase tracking-widest2 text-ivory/45">Departments</p>
          <p className="mt-3 font-display text-3xl text-ivory">
            {new Set(staff.map((s) => s.department)).size}
          </p>
        </div>
        <div className="card-surface p-6">
          <p className="font-body text-[11px] uppercase tracking-widest2 text-ivory/45">Open Tasks</p>
          <p className="mt-3 font-display text-3xl text-ivory">
            {staff.reduce((sum, s) => sum + s.tasksAssigned, 0)}
          </p>
        </div>
      </div>

      <div className="card-surface p-2">
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'department', label: 'Department' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' },
            { key: 'tasksAssigned', label: 'Assigned Tasks' },
          ]}
          rows={staff}
          renderCell={(row, key) => {
            if (key === 'status') return <Badge tone={statusTone[row.status]}>{row.status}</Badge>
            return row[key]
          }}
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Member">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            setModalOpen(false)
          }}
        >
          <Input label="Full Name" name="name" placeholder="e.g. Priya Sen" required />
          <Select label="Department" name="department">
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
          <Input label="Role" name="role" placeholder="e.g. Guest Relations Associate" required />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Staff Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

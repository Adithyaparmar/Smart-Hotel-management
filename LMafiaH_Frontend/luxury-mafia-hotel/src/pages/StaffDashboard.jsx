import { useEffect, useState } from 'react'
import { LogIn, LogOut, BedDouble, ClipboardList, Bell } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import { DashboardCard } from '../components/dashboard/DashboardWidgets'
import { Badge } from '../components/common/FormElements'
import { LoadingState, EmptyState } from '../components/common/States'
import { adminService } from '../services/adminService'
import { roomService } from '../services/roomService'
import { notifications } from '../data/people'

const statusTone = {
  Occupied: 'burgundy',
  Cleaning: 'signal',
  Available: 'success',
  Maintenance: 'warning',
  Reserved: 'gold',
}

function formatStatus(status) {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatPriority(priority) {
  return priority
    ? priority.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Normal'
}

export default function StaffDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      try {
        const [dashboardData, roomData] = await Promise.all([
          adminService.getStaffDashboard(),
          roomService.list(),
        ])

        if (!cancelled) {
          setDashboard(dashboardData)
          setRooms(roomData)
        }
      } catch (error) {
        console.error('Failed to load staff dashboard:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <LoadingState label="Loading today's operations." />
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-obsidian">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-10">
          <EmptyState
            title="Unable to load operations."
            description="Please refresh and try again."
          />
        </div>
      </div>
    )
  }

  const checkIns = Array.isArray(dashboard.todaysCheckIns)
    ? dashboard.todaysCheckIns
    : []

  const checkOuts = Array.isArray(dashboard.todaysCheckOuts)
    ? dashboard.todaysCheckOuts
    : []

  const openTasks = Array.isArray(dashboard.openTasks)
    ? dashboard.openTasks
    : []

  const roomsReady = Number(dashboard.roomsByStatus?.AVAILABLE || 0)

  const roomStatuses = rooms.map((room) => ({
    room: `${room.name} · ${room.roomNumber}`,
    status: formatStatus(room.status),
  }))

  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-10">
        <span className="eyebrow">Front of House</span>
        <h1 className="display-md mt-2">Today&rsquo;s Operations</h1>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            label="Today's Check-ins"
            value={checkIns.length}
            icon={LogIn}
          />

          <DashboardCard
            label="Today's Check-outs"
            value={checkOuts.length}
            icon={LogOut}
          />

          <DashboardCard
            label="Rooms Ready"
            value={roomsReady}
            icon={BedDouble}
          />

          <DashboardCard
            label="Open Tasks"
            value={openTasks.length}
            icon={ClipboardList}
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="card-surface p-6">
            <p className="mb-5 font-display text-lg text-ivory">Room Status</p>

            {roomStatuses.length === 0 ? (
              <p className="font-body text-sm text-ivory/40">
                No room data available.
              </p>
            ) : (
              <ul className="space-y-3">
                {roomStatuses.map((room) => (
                  <li
                    key={`${room.room}-${room.status}`}
                    className="flex items-center justify-between font-body text-sm text-ivory/70"
                  >
                    {room.room}

                    <Badge tone={statusTone[room.status] || 'neutral'}>
                      {room.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-surface p-6">
            <p className="mb-5 font-display text-lg text-ivory">
              Assigned Tasks
            </p>

            {openTasks.length === 0 ? (
              <p className="font-body text-sm text-ivory/40">
                No open tasks.
              </p>
            ) : (
              <ul className="space-y-3">
                {openTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-4 font-body text-sm text-ivory/70"
                  >
                    <span>{task.title || task.description || 'Task'}</span>

                    <Badge
                      tone={
                        task.priority === 'HIGH'
                          ? 'danger'
                          : task.priority === 'MEDIUM'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {formatPriority(task.priority)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 card-surface p-6">
          <div className="mb-5 flex items-center gap-2">
            <Bell className="h-4 w-4 text-gold" />
            <p className="font-display text-lg text-ivory">
              Guest Requests &amp; Notifications
            </p>
          </div>

          <ul className="divide-y divide-ivory/10">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="py-3 font-body text-sm text-ivory/70"
              >
                {notification.body}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
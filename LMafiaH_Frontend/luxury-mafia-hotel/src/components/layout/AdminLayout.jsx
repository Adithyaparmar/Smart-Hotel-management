import { Outlet, Link } from 'react-router-dom'
import {
  LayoutGrid,
  BedDouble,
  CalendarCheck,
  Users,
  UserCog,
  CreditCard,
  BarChart3,
  Sparkles,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import Sidebar from '../dashboard/Sidebar'
import { PageTransition } from '../common/Motion'

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/bookings', label: 'Reservations', icon: CalendarCheck },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/staff', label: 'Staff', icon: UserCog },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-obsidian">
      <Sidebar
        title="House Operations"
        items={items}
        footer={
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-2 font-body text-xs text-signal">
              <Sparkles className="h-3.5 w-3.5" /> AI Insights active
            </span>
            <span className="flex items-center gap-2 font-body text-xs text-ivory/40">
              <Settings className="h-3.5 w-3.5" /> Settings
            </span>
            <Link to="/" className="flex items-center gap-2 font-body text-xs text-ivory/40 hover:text-ivory/70">
              <ArrowLeft className="h-3.5 w-3.5" /> Exit to site
            </Link>
          </div>
        }
      />
      <div className="min-w-0 flex-1 overflow-x-hidden px-6 py-8 lg:px-10">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </div>
  )
}

import { LayoutGrid, BookOpen, Heart, User, Bell, Sparkles, LogOut } from 'lucide-react'
import { Outlet, Link } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import Sidebar from '../dashboard/Sidebar'
import CustomCursor from '../common/CustomCursor'
import { PageTransition } from '../common/Motion'
import { useAuth } from '../../context/AuthContext'

const items = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/dashboard/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="relative min-h-screen bg-obsidian">
      <div className="grain-overlay" />
      <CustomCursor />
      <Navbar />
      <div className="mx-auto flex max-w-7xl pt-24">
        <Sidebar
          title="Private Portal"
          items={items}
          footer={
            <div className="flex flex-col gap-3">
              <Link to="/ai-concierge" className="flex items-center gap-2 font-body text-xs text-signal">
                <Sparkles className="h-3.5 w-3.5" /> Ask The Consigliere
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 font-body text-xs text-ivory/40 hover:text-ivory/70"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          }
        />
        <div className="min-w-0 flex-1 px-6 py-10 lg:px-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="eyebrow">Welcome back</p>
              <h1 className="mt-2 font-display text-3xl text-ivory">
                {user?.name || 'Adithya Sharma'}
              </h1>
            </div>
            <button aria-label="Notifications" className="relative text-ivory/50 hover:text-gold">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold" />
            </button>
          </div>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </div>
      <Footer />
    </div>
  )
}

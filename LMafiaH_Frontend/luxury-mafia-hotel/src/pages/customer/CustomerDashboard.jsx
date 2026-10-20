import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Clock, BookOpen, Heart, Sparkles } from 'lucide-react'
import { DashboardCard, NotificationPanel } from '../../components/dashboard/DashboardWidgets'
import { bookingService } from '../../services/bookingService'
import { notifications } from '../../data/people'
import { rooms } from '../../data/rooms'
import { LoadingState } from '../../components/common/States'

export default function CustomerDashboard() {
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingService.listForCustomer().then((data) => {
      setMyBookings(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingState label="Preparing your portal." />

  const upcoming = myBookings.find((b) => b.status === 'Confirmed')
  const saved = rooms.slice(0, 3)

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Current Reservation"
          value={upcoming ? upcoming.roomName.split(' — ')[0] : 'None'}
          icon={CalendarCheck}
          hint={upcoming ? `${upcoming.checkIn} → ${upcoming.checkOut}` : 'No active stay'}
        />
        <DashboardCard
          label="Upcoming Arrival"
          value={upcoming ? upcoming.checkIn : '—'}
          icon={Clock}
          hint={upcoming ? `${upcoming.guests} guests` : 'Nothing scheduled'}
        />
        <DashboardCard label="Total Stays" value={myBookings.length} icon={BookOpen} hint="Lifetime bookings" />
        <DashboardCard label="Saved Suites" value={saved.length} icon={Heart} hint="Ready to reserve" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="font-display text-lg text-ivory">Saved Suites</p>
            <Link to="/rooms" className="font-body text-xs uppercase tracking-widest2 text-gold hover:text-ivory">
              Browse More →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {saved.map((room) => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 font-body text-sm text-ivory/80">{room.name}</p>
                <p className="font-body text-xs text-ivory/40">
                  {room.currency}{room.price.toLocaleString('en-IN')} / night
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-lg text-ivory">Notifications</p>
          </div>
          <NotificationPanel notifications={notifications} />
        </div>
      </div>

      <Link
        to="/ai-concierge"
        className="flex items-center justify-between border border-signal/20 bg-espresso/50 p-6 transition-colors hover:border-signal/40"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-signal" />
          <div>
            <p className="font-display text-lg text-ivory">Ask the Consigliere</p>
            <p className="font-body text-xs text-ivory/45">Get a personal recommendation in seconds.</p>
          </div>
        </div>
        <span className="font-body text-xs uppercase tracking-widest2 text-signal">Open →</span>
      </Link>
    </div>
  )
}

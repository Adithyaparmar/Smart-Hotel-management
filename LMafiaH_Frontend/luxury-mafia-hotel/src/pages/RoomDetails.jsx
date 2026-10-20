import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Maximize, Users, BedDouble, Eye } from 'lucide-react'
import { RoomGallery, AmenityList } from '../components/rooms/RoomGrid'
import { LoadingState, ErrorState } from '../components/common/States'
import { Select } from '../components/common/FormElements'
import { roomService } from '../services/roomService'
import { useBooking } from '../context/BookingContext'

export default function RoomDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [status, setStatus] = useState('loading')
  const { search, updateSearch } = useBooking()

  useEffect(() => {
    setStatus('loading')
    roomService
      .getById(id)
      .then((data) => {
        setRoom(data)
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }, [id])

  if (status === 'loading') return <div className="pt-32"><LoadingState label="Preparing the suite." /></div>
  if (status === 'error' || !room)
    return (
      <div className="pt-32">
        <ErrorState title="Suite not found" description="This suite may no longer be listed." />
      </div>
    )

  const handleReserve = () => {
    navigate(`/booking?roomId=${room.id}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-28 lg:px-10">
      <nav className="mb-6 font-body text-xs text-ivory/40">
        <Link to="/rooms" className="hover:text-gold">Rooms</Link> / <span className="text-ivory/60">{room.name}</span>
      </nav>

      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">{room.category}</span>
          <h1 className="display-lg mt-2">{room.name}</h1>
          <p className="mt-2 font-body text-sm text-ivory/50">{room.tagline}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-gold">
            {room.currency}
            {room.price.toLocaleString('en-IN')}
          </p>
          <p className="font-body text-xs text-ivory/40">per night</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_380px]">
        <div>
          <RoomGallery images={room.images} roomName={room.name} />

          <div className="mt-10 flex flex-wrap gap-8 border-y border-ivory/10 py-6">
            <span className="flex items-center gap-2 font-body text-sm text-ivory/70">
              <Maximize className="h-4 w-4 text-gold" /> {room.size}
            </span>
            <span className="flex items-center gap-2 font-body text-sm text-ivory/70">
              <Users className="h-4 w-4 text-gold" /> Up to {room.capacity} guests
            </span>
            <span className="flex items-center gap-2 font-body text-sm text-ivory/70">
              <BedDouble className="h-4 w-4 text-gold" /> {room.beds}
            </span>
            <span className="flex items-center gap-2 font-body text-sm text-ivory/70">
              <Eye className="h-4 w-4 text-gold" /> {room.view}
            </span>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl text-ivory">About This Suite</h2>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-ivory/60">
              {room.description}
            </p>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-2xl text-ivory">Amenities</h2>
            <div className="mt-5">
              <AmenityList amenities={room.amenities} />
            </div>
          </div>
        </div>

        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="h-fit lg:sticky lg:top-28"
        >
          <div className="card-surface border-gold/15 p-6">
            <p className="font-display text-xl text-ivory">Reserve {room.name}</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block font-body text-[11px] uppercase tracking-widest2 text-ivory/50">
                  Check-in
                </span>
                <input
                  type="date"
                  value={search.checkIn}
                  onChange={(e) => updateSearch({ checkIn: e.target.value })}
                  className="w-full border border-ivory/15 bg-transparent px-3 py-2.5 font-body text-sm text-ivory focus:border-gold focus:outline-none [color-scheme:dark]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block font-body text-[11px] uppercase tracking-widest2 text-ivory/50">
                  Check-out
                </span>
                <input
                  type="date"
                  value={search.checkOut}
                  onChange={(e) => updateSearch({ checkOut: e.target.value })}
                  className="w-full border border-ivory/15 bg-transparent px-3 py-2.5 font-body text-sm text-ivory focus:border-gold focus:outline-none [color-scheme:dark]"
                />
              </label>
              <Select
                label="Guests"
                value={search.guests}
                onChange={(e) => updateSearch({ guests: Number(e.target.value) })}
              >
                {Array.from({ length: room.capacity }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g} className="bg-obsidian">
                    {g} guest{g > 1 ? 's' : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-ivory/10 pt-5 font-body text-sm text-ivory/60">
              <span>Rate / night</span>
              <span className="text-ivory">
                {room.currency}
                {room.price.toLocaleString('en-IN')}
              </span>
            </div>
            <button onClick={handleReserve} data-cursor="button" className="btn-primary mt-6 w-full">
              Reserve
            </button>
          </div>
        </motion.aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-ivory/10 bg-obsidian/95 px-6 py-4 backdrop-blur-md lg:hidden">
        <div>
          <p className="font-display text-lg text-gold">
            {room.currency}
            {room.price.toLocaleString('en-IN')}
          </p>
          <p className="font-body text-[10px] text-ivory/40">per night</p>
        </div>
        <button onClick={handleReserve} className="btn-primary !px-6 !py-3">
          Reserve
        </button>
      </div>
    </div>
  )
}
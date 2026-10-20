import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'
import { Select } from '../components/common/FormElements'
import { RoomGrid } from '../components/rooms/RoomGrid'
import { LoadingState } from '../components/common/States'
import { roomService } from '../services/roomService'
import { roomTypes } from '../data/rooms'
import { useBooking } from '../context/BookingContext'

export default function RoomsExplorer() {
    const { search } = useBooking()

  const [allRooms, setAllRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [roomType, setRoomType] = useState('Any Room Type')
  const [maxGuests, setMaxGuests] = useState('Any')
  const [sort, setSort] = useState('recommended')

 useEffect(() => {
  let cancelled = false

  const loadRooms = async () => {
    setLoading(true)

    try {
      const data = await roomService.list({
        roomType,
        sort,
        checkInDate: search.checkIn,
        checkOutDate: search.checkOut,
        adults: search.guests,
        children: 0,
      })

      if (!cancelled) {
        setAllRooms(data)
      }
    } catch (error) {
      console.error('Failed to load available suites:', error)

      if (!cancelled) {
        setAllRooms([])
      }
    } finally {
      if (!cancelled) {
        setLoading(false)
      }
    }
  }

  loadRooms()

  return () => {
    cancelled = true
  }
}, [roomType, sort, search.checkIn, search.checkOut, search.guests])

  const filtered = useMemo(() => {
    if (maxGuests === 'Any') return allRooms
    return allRooms.filter((r) => r.capacity >= Number(maxGuests))
  }, [allRooms, maxGuests])

  return (
    <div className="pt-24">
      <section className="relative flex h-[52vh] min-h-[380px] items-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2000&auto=format&fit=crop"
          alt="Dark luxury hotel corridor"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/20" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 lg:px-10">
          <span className="eyebrow">Private Quarters</span>
          <h1 className="display-lg mt-3">Every suite, one house.</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="mb-12 flex flex-col gap-6 border border-ivory/10 bg-graphite/40 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3">
            <Select label="Room Type" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              {roomTypes.map((t) => (
                <option key={t} value={t} className="bg-obsidian">
                  {t}
                </option>
              ))}
            </Select>
            <Select label="Guests" value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)}>
              {['Any', '1', '2', '3', '4', '5', '6'].map((g) => (
                <option key={g} value={g} className="bg-obsidian">
                  {g}
                </option>
              ))}
            </Select>
            <Select label="Sort By" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended" className="bg-obsidian">Recommended</option>
              <option value="price-asc" className="bg-obsidian">Price: Low to High</option>
              <option value="price-desc" className="bg-obsidian">Price: High to Low</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 font-body text-xs uppercase tracking-widest2 text-ivory/40">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {filtered.length} suite{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <LoadingState label="Gathering available suites." />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <RoomGrid rooms={filtered} />
          </motion.div>
        )}
      </section>
    </div>
  )
}
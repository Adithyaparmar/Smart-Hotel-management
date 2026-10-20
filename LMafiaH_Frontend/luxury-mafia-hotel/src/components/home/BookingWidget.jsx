import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Select } from '../common/FormElements'
import { roomTypes } from '../../data/rooms'
import { useBooking } from '../../context/BookingContext'

export default function BookingWidget() {
  const { search, updateSearch } = useBooking()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/rooms')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-20 mx-auto -mt-20 w-full max-w-6xl px-6 lg:px-10"
    >
      <form
        onSubmit={handleSubmit}
        className="glass grid grid-cols-1 gap-5 border-gold/15 p-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end lg:p-8"
      >
        <label className="block">
          <span className="mb-2 block font-body text-[11px] uppercase tracking-widest2 text-ivory/50">
            Check-in
          </span>
          <input
            type="date"
            value={search.checkIn}
            onChange={(e) => updateSearch({ checkIn: e.target.value })}
            className="w-full border-b border-ivory/20 bg-transparent py-2 font-body text-sm text-ivory focus:border-gold focus:outline-none [color-scheme:dark]"
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
            className="w-full border-b border-ivory/20 bg-transparent py-2 font-body text-sm text-ivory focus:border-gold focus:outline-none [color-scheme:dark]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block font-body text-[11px] uppercase tracking-widest2 text-ivory/50">
            Guests
          </span>
          <input
            type="number"
            min={1}
            max={10}
            value={search.guests}
            onChange={(e) => updateSearch({ guests: Number(e.target.value) })}
            className="w-full border-b border-ivory/20 bg-transparent py-2 font-body text-sm text-ivory focus:border-gold focus:outline-none"
          />
        </label>
        <Select
          label="Room Type"
          value={search.roomType}
          onChange={(e) => updateSearch({ roomType: e.target.value })}
          className="!border-0 !border-b !border-ivory/20 !px-0 !py-2 focus:!border-gold"
        >
          {roomTypes.map((t) => (
            <option key={t} value={t} className="bg-obsidian">
              {t}
            </option>
          ))}
        </Select>
        <button type="submit" data-cursor="button" className="btn-primary h-fit w-full lg:w-auto">
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </form>
    </motion.div>
  )
}

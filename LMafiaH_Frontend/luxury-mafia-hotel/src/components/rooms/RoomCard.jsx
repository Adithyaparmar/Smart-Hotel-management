import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, Maximize } from 'lucide-react'

export default function RoomCard({ room, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link to={`/rooms/${room.id}`} data-cursor="view" className="block">
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={room.images[0]}
            alt={`${room.name} — ${room.category}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-cinematic group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/10 to-transparent" />
          <div className="absolute left-4 top-4">
            <span className="border border-ivory/30 bg-obsidian/50 px-3 py-1 font-body text-[10px] uppercase tracking-widest2 text-ivory backdrop-blur-sm">
              {room.category}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-display text-2xl text-ivory">{room.name}</p>
            <p className="mt-1 font-body text-xs text-ivory/60">{room.tagline}</p>
            <div className="mt-3 flex items-center gap-4 font-body text-[11px] text-ivory/50">
              <span className="flex items-center gap-1">
                <Maximize className="h-3 w-3" /> {room.size}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {room.capacity} guests
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <p className="font-body text-sm text-ivory/70">
          <span className="font-display text-lg text-gold">
            {room.currency}
            {room.price.toLocaleString('en-IN')}
          </span>{' '}
          / night
        </p>
        <div className="flex items-center gap-3">
          <Link
            to={`/rooms/${room.id}`}
            data-cursor="button"
            className="font-body text-[11px] uppercase tracking-widest2 text-ivory/60 hover:text-gold"
          >
            View Suite
          </Link>
          <Link
            to={`/booking?roomId=${room.id}`}
            data-cursor="button"
            className="font-body text-[11px] uppercase tracking-widest2 text-gold"
          >
            Reserve
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
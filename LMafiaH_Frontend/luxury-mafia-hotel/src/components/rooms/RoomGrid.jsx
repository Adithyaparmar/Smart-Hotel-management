import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import RoomCard from './RoomCard'
import { EmptyState } from '../common/States'

export function RoomGrid({ rooms }) {
  if (!rooms || rooms.length === 0) {
    return <EmptyState title="No suites match" description="Try adjusting your filters to see more options." />
  }
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room, i) => (
        <RoomCard key={room.id} room={room} index={i} />
      ))}
    </div>
  )
}

export function RoomGallery({ images, roomName }) {
  const [active, setActive] = useState(0)

  const go = (dir) => {
    setActive((prev) => (prev + dir + images.length) % images.length)
  }

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden bg-graphite">
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={images[active]}
            alt={`${roomName} — view ${active + 1}`}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous image"
              data-cursor="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 border border-ivory/20 bg-obsidian/50 p-2.5 text-ivory backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next image"
              data-cursor="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 border border-ivory/20 bg-obsidian/50 p-2.5 text-ivory backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              data-cursor="view"
              className={`aspect-[4/3] overflow-hidden border transition-colors ${
                active === i ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AmenityList({ amenities }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {amenities.map((a) => (
        <li key={a} className="flex items-center gap-2.5 font-body text-sm text-ivory/70">
          <Check className="h-3.5 w-3.5 shrink-0 text-gold" />
          {a}
        </li>
      ))}
    </ul>
  )
}
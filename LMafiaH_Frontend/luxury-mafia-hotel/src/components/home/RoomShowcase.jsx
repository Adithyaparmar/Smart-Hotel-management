import { Link } from 'react-router-dom'
import SectionHeading from '../common/SectionHeading'
import { RoomGrid } from '../rooms/RoomGrid'
import { rooms } from '../../data/rooms'

export default function RoomShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading
          eyebrow="Private Quarters"
          title="Suites reserved for the exceptional."
          description="Six residences, each built around a different way of being powerful."
        />
        <Link
          to="/rooms"
          data-cursor="button"
          className="shrink-0 font-body text-xs uppercase tracking-widest2 text-gold hover:text-ivory"
        >
          View All Suites →
        </Link>
      </div>
      <RoomGrid rooms={rooms} />
    </section>
  )
}

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SectionHeading from '../common/SectionHeading'
import { experiences, diningVenues } from '../../data/experiences'

export function ExperienceCard({ item, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07 }}
      className="group relative aspect-[3/4] overflow-hidden"
      data-cursor="view"
    >
      <img
        src={item.image}
        alt={item.name}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-[1100ms] ease-cinematic group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian/95 via-obsidian/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-display text-xl text-ivory">{item.name}</p>
        <p className="mt-1 font-body text-xs text-ivory/55">{item.description}</p>
      </div>
    </motion.div>
  )
}

export function DiningCard({ venue, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
      className="group grid grid-cols-1 gap-0 overflow-hidden border border-ivory/10 sm:grid-cols-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-auto">
        <img
          src={venue.image}
          alt={venue.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1100ms] ease-cinematic group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col justify-center bg-graphite/60 p-7">
        <p className="font-display text-2xl text-ivory">{venue.name}</p>
        <p className="mt-2 font-body text-sm text-ivory/55">{venue.description}</p>
        <p className="mt-4 font-body text-[11px] uppercase tracking-widest2 text-gold/80">{venue.hours}</p>
      </div>
    </motion.div>
  )
}

export function ExperiencesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow="Beyond The Room" title="The Experience" />
        <Link to="/experiences" data-cursor="button" className="font-body text-xs uppercase tracking-widest2 text-gold hover:text-ivory">
          Explore All →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {experiences.map((e, i) => (
          <ExperienceCard key={e.id} item={e} index={i} />
        ))}
      </div>
    </section>
  )
}

export function DiningSection() {
  return (
    <section className="bg-graphite/40 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="Table &amp; Cellar" title="Dining, kept private." />
          <Link to="/dining" data-cursor="button" className="font-body text-xs uppercase tracking-widest2 text-gold hover:text-ivory">
            View Dining →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {diningVenues.slice(0, 4).map((v, i) => (
            <DiningCard key={v.id} venue={v} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

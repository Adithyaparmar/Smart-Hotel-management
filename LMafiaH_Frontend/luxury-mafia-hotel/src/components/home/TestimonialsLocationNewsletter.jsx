import { motion } from 'framer-motion'
import { Quote, MapPin, Phone, Mail, Clock } from 'lucide-react'
import SectionHeading from '../common/SectionHeading'
import { testimonials } from '../../data/testimonials'

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <SectionHeading eyebrow="Guest Word" title="What is said, quietly." align="center" />
      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
            className="card-surface p-8"
          >
            <Quote className="h-5 w-5 text-gold/50" />
            <p className="mt-4 font-display text-xl leading-snug text-ivory/90">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-6 font-body text-xs uppercase tracking-widest2 text-ivory/40">
              {t.name} — {t.role}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function LocationSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Find The House" title="Luxury Mafia Hotel" />
          <ul className="mt-8 space-y-5">
            <li className="flex gap-3 font-body text-sm text-ivory/65">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Ring Road, Dhurwa Dam, Ranchi, Jharkhand, India
            </li>
            <li className="flex gap-3 font-body text-sm text-ivory/65">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> +91 9508371801
            </li>
            <li className="flex gap-3 font-body text-sm text-ivory/65">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> zhyrenParmar@luxurymafiahotel.com
            </li>
            <li className="flex gap-3 font-body text-sm text-ivory/65">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Reception open 24 hours
            </li>
          </ul>
        </div>
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border border-ivory/10 bg-graphite">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(198,166,100,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(198,166,100,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative flex flex-col items-center gap-2">
            <MapPin className="h-6 w-6 text-gold" />
            <span className="font-body text-xs uppercase tracking-widest2 text-ivory/40">
              Map available on request
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Newsletter() {
  return (
    <section className="border-t border-ivory/10 bg-graphite/50 py-24">
      <div className="mx-auto max-w-2xl px-6 text-center lg:px-10">
        <SectionHeading eyebrow="Stay Informed" title="Private Access." align="center" />
        <p className="mx-auto mt-4 max-w-sm font-body text-sm text-ivory/50">
          Rare rooms, seasonal menus, and invitations that don&rsquo;t appear anywhere else.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="Email address"
            aria-label="Email address"
            className="w-full border border-ivory/15 bg-transparent px-4 py-3.5 font-body text-sm text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none"
          />
          <button type="submit" data-cursor="button" className="btn-primary shrink-0">
            Request Access
          </button>
        </form>
      </div>
    </section>
  )
}

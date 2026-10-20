import { motion } from 'framer-motion'
import SectionHeading from '../common/SectionHeading'
import { Counter } from '../common/Motion'

const pillars = [
  { label: 'Privacy', desc: 'No detail of your stay leaves this house.' },
  { label: 'Precision', desc: 'Every request anticipated before it is spoken.' },
  { label: 'Hospitality', desc: 'Service that feels like belonging, not transaction.' },
  { label: 'Intelligence', desc: 'A concierge that learns your preferences, quietly.' },
]

export default function BrandStory() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] overflow-hidden"
        >
          <img
            src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1600&auto=format&fit=crop"
            alt="Dark walnut interior with candlelight"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 border border-gold/15" style={{ margin: '18px' }} />
        </motion.div>

        <div>
          <SectionHeading
            eyebrow="Our Philosophy"
            title="A sanctuary for those who expect more."
            description="Luxury Mafia Hotel was built on a simple premise: that true hospitality is invisible. Behind every unremarkable moment of your stay sits a house that has thought of everything, so you never have to ask twice."
          />
          <div className="mt-10 grid grid-cols-2 gap-8">
            {pillars.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="border-l border-gold/30 pl-4"
              >
                <p className="font-display text-lg text-ivory">{p.label}</p>
                <p className="mt-1 font-body text-xs leading-relaxed text-ivory/45">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex gap-12 border-t border-ivory/10 pt-8">
            <div>
              <p className="font-display text-3xl text-gold">
                <Counter value={48} suffix="" />
              </p>
              <p className="mt-1 font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
                Private Suites
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold">
                <Counter value={17} suffix=" yrs" />
              </p>
              <p className="mt-1 font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
                Under One Family
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-gold">
                <Counter value={98} suffix="%" />
              </p>
              <p className="mt-1 font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
                Return Guests
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

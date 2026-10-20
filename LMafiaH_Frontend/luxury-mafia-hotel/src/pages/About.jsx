import { motion } from 'framer-motion'
import SectionHeading from '../components/common/SectionHeading'
import { Counter } from '../components/common/Motion'

const values = [
  { title: 'Privacy First', desc: 'What happens inside the house stays inside the house. No exceptions, no stories.' },
  { title: 'Old-World Standards', desc: 'Three generations of hospitality, refined rather than replaced by technology.' },
  { title: 'Quiet Intelligence', desc: 'Our systems anticipate, they never announce themselves.' },
  { title: 'Absolute Discretion', desc: 'Guests are known by name, never by headline.' },
]

export default function About() {
  return (
    <div className="pt-24">
      <section className="relative flex h-[70vh] min-h-[520px] items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2200&auto=format&fit=crop"
          alt="Italian architectural interior in dark tones"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/40 via-obsidian/70 to-obsidian" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-10">
          <span className="eyebrow">Our Story</span>
          <h1 className="display-xl mt-4">
            Three generations.
            <br />
            One standard.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-10">
        <p className="font-display text-2xl leading-relaxed text-ivory/85">
          Luxury Mafia Hotel began as a single private residence, opened to a small circle of guests who
          preferred not to be seen arriving anywhere else. What started as a favor between families became
          a standard — and eventually, a house of its own.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">
        <SectionHeading eyebrow="What We Hold To" title="The house rules." align="center" />
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
              className="border-l border-gold/30 pl-5"
            >
              <p className="font-display text-xl text-ivory">{v.title}</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-ivory/50">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-ivory/10 bg-graphite/40 py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-8 px-6 text-center lg:px-10">
          <div>
            <p className="font-display text-4xl text-gold"><Counter value={1971} /></p>
            <p className="mt-2 font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
              House Founded
            </p>
          </div>
          <div>
            <p className="font-display text-4xl text-gold"><Counter value={3} /></p>
            <p className="mt-2 font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
              Generations
            </p>
          </div>
          <div>
            <p className="font-display text-4xl text-gold"><Counter value={48} /></p>
            <p className="mt-2 font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
              Private Suites
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

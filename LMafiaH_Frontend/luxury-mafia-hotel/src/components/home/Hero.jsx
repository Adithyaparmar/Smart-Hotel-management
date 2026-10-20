import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

const heading = ['THE PRIVATE SIDE', 'OF LUXURY.']

export default function Hero() {
  return (
    <section className="relative flex h-screen min-h-[720px] w-full items-end overflow-hidden">
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2400&auto=format&fit=crop"
          alt="A dark, marble-lined penthouse suite at night"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-obsidian/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/60 via-transparent to-transparent" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="eyebrow"
        >
          Milano · By Invitation &amp; Reservation
        </motion.span>

        <h1 className="mt-5 overflow-hidden">
          {heading.map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="display-xl block"
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.7 }}
          className="mt-6 max-w-md font-body text-base text-ivory/65"
        >
          Where timeless hospitality meets intelligent technology.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="mt-9 flex flex-wrap items-center gap-5"
        >
          <Link to="/rooms" data-cursor="button" className="btn-primary">
            Reserve Your Stay
          </Link>
          <Link to="/ai-concierge" data-cursor="button" className="btn-outline">
            Meet The Consigliere
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5 text-ivory/50" />
        </motion.div>
      </motion.div>
    </section>
  )
}

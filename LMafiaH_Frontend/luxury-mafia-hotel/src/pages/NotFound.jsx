import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-graphite to-obsidian" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center"
      >
        <span className="font-display text-8xl text-gold/30">404</span>
        <h1 className="display-md mt-4">
          The door you were looking for
          <br />
          does not exist.
        </h1>
        <Link to="/" className="btn-primary mt-10 inline-flex">
          Return To The Hotel
        </Link>
      </motion.div>
    </div>
  )
}

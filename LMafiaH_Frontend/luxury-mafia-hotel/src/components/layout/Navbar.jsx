import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Sparkles, X } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/experiences', label: 'Experiences' },
  { to: '/dining', label: 'Dining' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-cinematic ${
          scrolled ? 'bg-obsidian/85 backdrop-blur-md border-b border-ivory/10' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/" data-cursor="button" className="flex items-center gap-2">
            <span className="font-display text-xl tracking-wide text-ivory">
              LUXURY <span className="text-gold">MAFIA</span> HOTEL
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                data-cursor="button"
                className={({ isActive }) =>
                  `font-body text-[11px] uppercase tracking-widest2 transition-colors duration-300 ${
                    isActive ? 'text-gold' : 'text-ivory/70 hover:text-gold'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <Link
              to="/ai-concierge"
              data-cursor="button"
              className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-widest2 text-signal/90 transition-colors hover:text-signal"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Concierge
            </Link>
            <Link
              to="/login"
              data-cursor="button"
              className="font-body text-[11px] uppercase tracking-widest2 text-ivory/70 transition-colors hover:text-gold"
            >
              Login
            </Link>
            <Link to="/rooms" data-cursor="button" className="btn-primary !px-6 !py-3">
              Reserve
            </Link>
          </div>

          <button
            className="text-ivory lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-obsidian lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <span className="font-display text-lg text-ivory">
                LUXURY <span className="text-gold">MAFIA</span> HOTEL
              </span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-ivory">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col items-start justify-center gap-2 px-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                >
                  <Link to={link.to} className="font-display text-4xl text-ivory hover:text-gold">
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-6 flex flex-col gap-4"
              >
                <Link to="/ai-concierge" className="font-body text-sm uppercase tracking-widest2 text-signal">
                  AI Concierge
                </Link>
                <Link to="/login" className="font-body text-sm uppercase tracking-widest2 text-ivory/70">
                  Login
                </Link>
              </motion.div>
            </nav>
            <div className="border-t border-ivory/10 p-8">
              <Link to="/rooms" className="btn-primary w-full">
                Reserve Your Stay
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

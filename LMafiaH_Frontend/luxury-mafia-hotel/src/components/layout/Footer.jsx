import { Link } from 'react-router-dom'
import { Instagram, Linkedin, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-ivory/10 bg-graphite">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <span className="font-display text-xl text-ivory">
              LUXURY <span className="text-gold">MAFIA</span> HOTEL
            </span>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-ivory/45">
              A private Italian sanctuary of old-money hospitality and intelligent technology.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" aria-label="Instagram" className="text-ivory/40 hover:text-gold">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="text-ivory/40 hover:text-gold">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-ivory/40 hover:text-gold">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-5">Navigation</p>
            <ul className="space-y-3 font-body text-sm text-ivory/55">
              <li><Link to="/rooms" className="hover:text-gold">Rooms</Link></li>
              <li><Link to="/experiences" className="hover:text-gold">Experiences</Link></li>
              <li><Link to="/dining" className="hover:text-gold">Dining</Link></li>
              <li><Link to="/about" className="hover:text-gold">About</Link></li>
              <li><Link to="/ai-concierge" className="hover:text-gold">AI Concierge</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-5">Contact</p>
            <ul className="space-y-3 font-body text-sm text-ivory/55">
              <li>Ring Road, Dhurwa Dam, Ranchi, Jharkhand, India</li>
              <li>+91 9508371801</li>
              <li>zhyrenParmar@luxurymafiahotel.com</li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-5">Private Access</p>
            <p className="mb-4 font-body text-sm text-ivory/55">
              Occasional dispatches. Nothing else.
            </p>
            <form className="flex border-b border-ivory/20 pb-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                className="w-full bg-transparent font-body text-sm text-ivory placeholder:text-ivory/30 focus:outline-none"
              />
              <button type="submit" className="font-body text-xs uppercase tracking-widest2 text-gold">
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-8 font-body text-xs text-ivory/35 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Luxury Mafia Hotel. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-gold">Privacy</Link>
            <Link to="#" className="hover:text-gold">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

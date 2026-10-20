import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Loader2, Check } from 'lucide-react'
import { Input, Select } from '../components/common/FormElements'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' })
  const [status, setStatus] = useState('idle')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    await new Promise((r) => setTimeout(r, 900))
    setStatus('sent')
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-32 lg:px-10">
      <span className="eyebrow">Reach The House</span>
      <h1 className="display-lg mt-2 max-w-xl">We answer quietly, but we answer.</h1>

      <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="font-body text-xs uppercase tracking-widest2 text-ivory/40">Address</p>
                <p className="mt-1 font-body text-sm text-ivory/75">Ring Road, Dhurwa Dam, Ranchi, Jharkhand, India</p>
              </div>
            </li>
            <li className="flex gap-4">
              <Phone className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="font-body text-xs uppercase tracking-widest2 text-ivory/40">Phone</p>
                <p className="mt-1 font-body text-sm text-ivory/75">+91 9508371801</p>
              </div>
            </li>
            <li className="flex gap-4">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="font-body text-xs uppercase tracking-widest2 text-ivory/40">Email</p>
                <p className="mt-1 font-body text-sm text-ivory/75">zhyrenParmar@luxurymafiahotel.com</p>
              </div>
            </li>
            <li className="flex gap-4">
              <Clock className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="font-body text-xs uppercase tracking-widest2 text-ivory/40">Hours</p>
                <p className="mt-1 font-body text-sm text-ivory/75">Reception open 24 hours</p>
              </div>
            </li>
          </ul>

          <div className="relative mt-10 flex aspect-[16/9] items-center justify-center overflow-hidden border border-ivory/10 bg-graphite">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(198,166,100,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(198,166,100,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative flex flex-col items-center gap-2">
              <MapPin className="h-6 w-6 text-gold" />
              <span className="font-body text-xs uppercase tracking-widest2 text-ivory/40">
                Map available on request
              </span>
            </div>
          </div>
        </div>

        <div>
          {status === 'sent' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 border border-gold/20 bg-gold/5 p-10 text-center"
            >
              <Check className="h-6 w-6 text-gold" />
              <p className="font-display text-xl text-ivory">Message received.</p>
              <p className="font-body text-sm text-ivory/50">
                The house will respond within one business day.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Select
                label="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              >
                {['General Enquiry', 'Reservations', 'Private Events', 'Press'].map((s) => (
                  <option key={s} value={s} className="bg-obsidian">
                    {s}
                  </option>
                ))}
              </Select>
              <label className="block">
                <span className="mb-2 block font-body text-[11px] uppercase tracking-widest2 text-ivory/50">
                  Message
                </span>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-ivory/15 bg-transparent px-4 py-3.5 font-body text-sm text-ivory placeholder:text-ivory/30 focus:border-gold focus:outline-none"
                />
              </label>
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
                {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

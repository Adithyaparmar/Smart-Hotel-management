import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import { AIMessage, AIRecommendation } from '../ai/AIChat'

export default function AIConciergePreview() {
  return (
    <section className="relative overflow-hidden border-y border-signal/10 bg-espresso py-28">
      <div className="pointer-events-none absolute -right-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-signal/5 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-2 lg:items-center lg:px-10">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 font-body text-[11px] uppercase tracking-widest2 text-signal/80"
          >
            <Sparkles className="h-3.5 w-3.5" /> The Consigliere
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="display-lg mt-4"
          >
            Your private AI concierge.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 max-w-md font-body text-sm leading-relaxed text-ivory/55"
          >
            The Consigliere knows the house better than anyone who works in it. Ask for a suite, a table, a
            car — it handles the rest, quietly, in the background.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Link
              to="/ai-concierge"
              data-cursor="button"
              className="mt-8 inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest2 text-signal transition-colors hover:text-ivory"
            >
              Open the Consigliere <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass border-signal/15 p-6"
        >
          <div className="mb-4 flex items-center gap-2 border-b border-ivory/10 pb-4">
            <span className="h-2 w-2 rounded-full bg-signal" />
            <span className="font-body text-[11px] uppercase tracking-widest2 text-ivory/40">
              Live session
            </span>
          </div>
          <div className="space-y-4">
            <AIMessage role="user">
              Find me a suite for two people for three nights under ₹40,000.
            </AIMessage>
            <div className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest2 text-signal/70">
              <span className="h-1 w-1 animate-pulse rounded-full bg-signal" />
              Searching availability · 3 nights · 2 guests
            </div>
            <AIMessage role="ai">Good evening. I found two suites matching your preferences.</AIMessage>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AIRecommendation roomId="the-don" />
              <AIRecommendation roomId="the-capo" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

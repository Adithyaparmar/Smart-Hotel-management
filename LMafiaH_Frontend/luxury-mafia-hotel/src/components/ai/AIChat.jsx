import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Cpu, Send, Sparkles } from 'lucide-react'
import { getRoomById } from '../../data/rooms'
import { aiService } from '../../services/aiService'

export function AIMessage({ role, children }) {
  const isAI = role === 'ai'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[85%] px-5 py-3.5 font-body text-sm leading-relaxed ${
          isAI
            ? 'border border-signal/20 bg-espresso/60 text-ivory/90'
            : 'bg-gold/10 border border-gold/25 text-ivory'
        }`}
      >
        {children}
      </div>
    </motion.div>
  )
}

export function AIRecommendation({ roomId }) {
  const room = getRoomById(roomId)
  if (!room) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex gap-4 border border-ivory/10 bg-graphite/70 p-3"
    >
      <img src={room.images[0]} alt={room.name} className="h-20 w-20 shrink-0 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="font-body text-[10px] uppercase tracking-widest2 text-gold/80">{room.category}</p>
        <p className="font-display text-lg text-ivory">{room.name}</p>
        <p className="mt-0.5 font-body text-xs text-ivory/45">
          {room.currency}
          {room.price.toLocaleString('en-IN')} / night · {room.capacity} guests
        </p>
        <div className="mt-2 flex gap-4">
          <Link to={`/rooms/${room.id}`} className="font-body text-[11px] uppercase tracking-widest2 text-ivory/60 hover:text-gold">
            View Suite
          </Link>
          <Link to={`/booking?roomId=${room.id}`} className="font-body text-[11px] uppercase tracking-widest2 text-gold">
            Reserve
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 border border-signal/20 bg-espresso/60 px-5 py-3.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-signal/70"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function ToolStatus({ label }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest2 text-signal/70"
    >
      <Cpu className="h-3 w-3 animate-pulse" />
      {label}
    </motion.div>
  )
}

const initialMessages = [
  {
    id: 'greet',
    role: 'ai',
    text: 'Good evening. I am the Consigliere — tell me what kind of stay you have in mind.',
  },
]

export default function AIChat({ suggestedPrompts = [] }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  const send = async (text) => {
    const query = text ?? input
    if (!query.trim() || pending) return

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: query }])
    setInput('')
    setPending(true)

    try {
      const result = await aiService.sendMessage(query, conversationId)
      if (result.conversationId) setConversationId(result.conversationId)

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'ai',
          text: result.reply,
          toolStatus: result.toolStatus,
          recommendations: result.recommendations,
        },
      ])
    } catch (error) {
      let text = error.message || 'The Consigliere is unavailable right now.'
      if (error.status === 429 || error.code === 'AI_RATE_LIMITED') {
        text = 'The Consigliere is temporarily at its AI request limit. Please wait a moment before trying again.'
      }
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'ai', text }])
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
        {messages.map((m) => (
          <div key={m.id} className="space-y-3">
            <AIMessage role={m.role}>{m.text}</AIMessage>
            {m.toolStatus && (
              <div className={m.role === 'ai' ? 'ml-1' : 'ml-auto w-fit'}>
                <ToolStatus label={m.toolStatus} />
              </div>
            )}
            {m.recommendations?.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {m.recommendations.map((id) => (
                  <AIRecommendation key={id} roomId={id} />
                ))}
              </div>
            )}
          </div>
        ))}
        {pending && <TypingIndicator />}
      </div>

      {suggestedPrompts.length > 0 && messages.length < 2 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              data-cursor="button"
              className="border border-ivory/15 px-3.5 py-2 font-body text-xs text-ivory/60 transition-colors hover:border-gold hover:text-gold"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="flex items-center gap-3 border border-ivory/15 bg-espresso/50 px-4 py-3"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-signal/70" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Consigliere anything about your stay…"
          className="flex-1 bg-transparent font-body text-sm text-ivory placeholder:text-ivory/30 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send message"
          data-cursor="button"
          className="text-gold transition-transform hover:scale-110 disabled:opacity-30"
          disabled={pending}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}

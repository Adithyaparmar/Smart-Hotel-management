import { useState } from 'react'
import { Plus, MessageSquare, Trash2, Sparkles } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import CustomCursor from '../components/common/CustomCursor'
import AIChat from '../components/ai/AIChat'
import { suggestedPrompts, priorConversations } from '../data/aiConversations'

export default function AIConcierge() {
  const [activeConv, setActiveConv] = useState('new')
  const [chatKey, setChatKey] = useState(0)

  const handleNewChat = () => {
    setActiveConv('new')
    setChatKey((k) => k + 1)
  }

  return (
    <div className="flex h-screen flex-col bg-obsidian pt-20 lg:flex-row">
      <div className="grain-overlay" />
      <CustomCursor />
      <Navbar />
      {/* Conversation sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-ivory/10 bg-graphite/50 lg:flex">
        <div className="p-5">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 border border-gold/30 py-3 font-body text-xs uppercase tracking-widest2 text-gold transition-colors hover:bg-gold/10"
          >
            <Plus className="h-3.5 w-3.5" /> New Conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <p className="px-2 py-2 font-body text-[10px] uppercase tracking-widest2 text-ivory/30">
            Recent
          </p>
          {priorConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConv(c.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-3 text-left font-body text-sm transition-colors ${
                activeConv === c.id ? 'bg-ivory/5 text-ivory' : 'text-ivory/50 hover:bg-ivory/5'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-ivory/10 p-5">
          <button className="flex items-center gap-2 font-body text-xs text-ivory/35 hover:text-ivory/60">
            <Trash2 className="h-3.5 w-3.5" /> Clear all conversations
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-ivory/10 bg-espresso/40 px-6 py-5 lg:px-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-signal/40 bg-signal/5">
            <Sparkles className="h-4 w-4 text-signal" />
          </div>
          <div>
            <p className="font-display text-lg text-ivory">The Consigliere</p>
            <p className="font-body text-[10px] uppercase tracking-widest2 text-ivory/40">
              Your Private AI Concierge
            </p>
          </div>
        </div>
        <div className="min-h-0 flex-1 px-6 py-6 lg:px-10">
          <AIChat key={chatKey} suggestedPrompts={suggestedPrompts} />
        </div>
      </div>
    </div>
  )
}

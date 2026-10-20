import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'

export function LoadingState({ label = 'Preparing your view.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
      <p className="font-body text-xs uppercase tracking-widest2 text-ivory/40">{label}</p>
    </div>
  )
}

export function EmptyState({
  title = 'Nothing here yet.',
  description = 'When there is something to show, it will appear here.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-dashed border-ivory/15 px-8 py-20 text-center">
      <Inbox className="h-6 w-6 text-ivory/25" />
      <div>
        <p className="font-display text-xl text-ivory">{title}</p>
        <p className="mt-2 font-body text-sm text-ivory/50">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({
  title = 'Something did not go to plan.',
  description = 'Please try again, or reach the house directly.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-red-500/20 bg-red-500/5 px-8 py-20 text-center">
      <AlertTriangle className="h-6 w-6 text-red-400" />
      <div>
        <p className="font-display text-xl text-ivory">{title}</p>
        <p className="mt-2 font-body text-sm text-ivory/50">{description}</p>
      </div>
      {action}
    </div>
  )
}

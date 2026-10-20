import { forwardRef } from 'react'

export function Button({
  as: Comp = 'button',
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const base =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'outline'
      ? 'btn-outline'
      : 'btn-ghost'
  return (
    <Comp className={`${base} ${className}`} {...props}>
      {children}
    </Comp>
  )
}

export function Badge({ children, tone = 'gold', className = '' }) {
  const tones = {
    gold: 'border-gold/40 text-gold bg-gold/5',
    signal: 'border-signal/40 text-signal bg-signal/5',
    burgundy: 'border-burgundy/50 text-[#d98d99] bg-burgundy/10',
    neutral: 'border-ivory/20 text-ivory/70 bg-ivory/5',
    success: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5',
    warning: 'border-amber-500/40 text-amber-400 bg-amber-500/5',
    danger: 'border-red-500/40 text-red-400 bg-red-500/5',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-widest2 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export const Input = forwardRef(function Input(
  { label, error, className = '', id, ...props },
  ref
) {
  const inputId = id || props.name
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-2 block font-body text-[11px] uppercase tracking-widest2 text-ivory/50">
          {label}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full border bg-transparent px-4 py-3.5 font-body text-sm text-ivory placeholder:text-ivory/30 transition-colors duration-300 focus:outline-none ${
          error
            ? 'border-red-500/60 focus:border-red-500'
            : 'border-ivory/15 focus:border-gold'
        } ${className}`}
        {...props}
      />
      {error && <span className="mt-1.5 block text-xs text-red-400">{error}</span>}
    </label>
  )
})

export const Select = forwardRef(function Select(
  { label, className = '', id, children, ...props },
  ref
) {
  const selectId = id || props.name
  return (
    <label className="block" htmlFor={selectId}>
      {label && (
        <span className="mb-2 block font-body text-[11px] uppercase tracking-widest2 text-ivory/50">
          {label}
        </span>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full appearance-none border border-ivory/15 bg-transparent bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%228%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20stroke%3D%22%23C6A664%22%20fill%3D%22none%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E')] bg-[right_1rem_center] bg-no-repeat px-4 py-3.5 font-body text-sm text-ivory transition-colors duration-300 focus:border-gold focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
})

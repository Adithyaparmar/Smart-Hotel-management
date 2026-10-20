import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const [variant, setVariant] = useState('default') // default | button | view
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isDesktop || !isFinePointer) return
    setEnabled(true)
    document.body.classList.add('cursor-enabled')

    const move = (e) => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }
      const target = e.target.closest('[data-cursor]')
      setVariant(target ? target.getAttribute('data-cursor') : 'default')
    }

    window.addEventListener('mousemove', move)
    return () => {
      window.removeEventListener('mousemove', move)
      document.body.classList.remove('cursor-enabled')
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      ref={dotRef}
      className="pointer-events-none fixed left-0 top-0 z-[70] -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
    >
      <div
        className={`flex items-center justify-center rounded-full border transition-all duration-200 ease-out ${
          variant === 'button'
            ? 'h-11 w-11 border-gold bg-gold/10'
            : variant === 'view'
            ? 'h-16 w-16 border-gold bg-obsidian/60'
            : 'h-2.5 w-2.5 border-transparent bg-gold'
        }`}
      >
        {variant === 'view' && (
          <span className="font-body text-[9px] uppercase tracking-widest2 text-gold">View</span>
        )}
      </div>
    </div>
  )
}

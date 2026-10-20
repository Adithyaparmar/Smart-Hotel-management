import { NavLink } from 'react-router-dom'

export default function Sidebar({ title, items, footer }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ivory/10 bg-graphite/60 lg:flex">
      <div className="border-b border-ivory/10 px-6 py-6">
        <p className="font-display text-lg text-ivory">{title}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-6">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 font-body text-sm transition-colors duration-200 ${
                isActive
                  ? 'bg-gold/10 text-gold border-l-2 border-gold'
                  : 'text-ivory/55 border-l-2 border-transparent hover:text-ivory hover:bg-ivory/5'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {footer && <div className="border-t border-ivory/10 px-6 py-5">{footer}</div>}
    </aside>
  )
}

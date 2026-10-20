import { motion } from 'framer-motion'

export function DashboardCard({ label, value, icon: Icon, hint, tone = 'default' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="card-surface p-6"
    >
      <div className="flex items-start justify-between">
        <p className="font-body text-[11px] uppercase tracking-widest2 text-ivory/45">{label}</p>
        {Icon && (
          <Icon className={`h-4 w-4 ${tone === 'signal' ? 'text-signal' : 'text-gold'}`} />
        )}
      </div>
      <p className="mt-4 font-display text-3xl text-ivory">{value}</p>
      {hint && <p className="mt-2 font-body text-xs text-ivory/40">{hint}</p>}
    </motion.div>
  )
}

export function ChartCard({ title, description, children }) {
  return (
    <div className="card-surface p-6">
      <div className="mb-6">
        <p className="font-display text-lg text-ivory">{title}</p>
        {description && <p className="mt-1 font-body text-xs text-ivory/40">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function DataTable({ columns, rows, renderCell, emptyLabel = 'No records.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="py-16 text-center font-body text-sm text-ivory/40">{emptyLabel}</div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ivory/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 font-body text-[10px] font-semibold uppercase tracking-widest2 text-ivory/40"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className="border-b border-ivory/5 transition-colors hover:bg-ivory/[0.03]">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-4 font-body text-sm text-ivory/80">
                  {renderCell ? renderCell(row, col.key) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function NotificationPanel({ notifications }) {
  return (
    <div className="divide-y divide-ivory/10">
      {notifications.map((n) => (
        <div key={n.id} className="flex gap-3 py-4">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.unread ? 'bg-gold' : 'bg-transparent'}`}
          />
          <div>
            <p className="font-body text-sm text-ivory">{n.title}</p>
            <p className="mt-1 font-body text-xs text-ivory/45">{n.body}</p>
            <p className="mt-1.5 font-body text-[10px] uppercase tracking-widest2 text-ivory/30">
              {n.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

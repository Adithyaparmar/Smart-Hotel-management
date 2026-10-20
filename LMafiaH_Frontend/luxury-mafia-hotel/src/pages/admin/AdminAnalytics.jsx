import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { Info, IndianRupee, CalendarCheck, Percent, TrendingUp } from 'lucide-react'
import { ChartCard, DashboardCard } from '../../components/dashboard/DashboardWidgets'
import { LoadingState } from '../../components/common/States'
import { adminService } from '../../services/adminService'

const chartTooltipStyle = {
  background: '#14120F',
  border: '1px solid rgba(198,166,100,0.25)',
  fontSize: 12,
  fontFamily: 'Manrope, sans-serif',
  color: '#EDE6D6',
}

const pieColors = ['#C6A664', '#4FD8E0', '#9F8146', '#6E1F2A']

export default function AdminAnalytics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    adminService.getOverview().then(setData)
  }, [])

  if (!data) return <LoadingState label="Compiling analytics." />

  const { kpis, revenueTrend, occupancyTrend, roomPopularity, bookingSources } = data
  const avgBookingValue = Math.round(
    revenueTrend.reduce((s, m) => s + m.revenue, 0) / revenueTrend.reduce((s, m) => s + m.bookings, 0)
  )

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow">House Operations</span>
          <h1 className="display-md mt-2">Analytics</h1>
        </div>
        <div className="flex items-center gap-2 border border-signal/30 bg-signal/5 px-4 py-2 font-body text-[11px] text-signal/90">
          <Info className="h-3.5 w-3.5 shrink-0" />
          All figures below are demo / mock data for portfolio purposes.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Revenue (MTD)"
          value={`₹${(kpis.revenueMTD / 100000).toFixed(1)}L`}
          icon={IndianRupee}
          tone="signal"
        />
        <DashboardCard label="Occupancy Rate" value={`${kpis.occupancyRate}%`} icon={Percent} />
        <DashboardCard
          label="Avg. Booking Value"
          value={`₹${avgBookingValue.toLocaleString('en-IN')}`}
          icon={TrendingUp}
        />
        <DashboardCard
          label="Bookings (MTD)"
          value={revenueTrend[revenueTrend.length - 1].bookings}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ChartCard title="Monthly Revenue Trend" description="Last 6 months, in ₹">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueTrend}>
              <CartesianGrid stroke="rgba(237,230,214,0.06)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="rgba(237,230,214,0.35)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v / 100000}L`}
              />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Line type="monotone" dataKey="revenue" stroke="#C6A664" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booking Sources" description="Where reservations originate">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={bookingSources}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {bookingSources.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} stroke="#0B0A08" />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: '#EDE6D6', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Occupancy" description="Percentage occupied by day">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={occupancyTrend}>
              <CartesianGrid stroke="rgba(237,230,214,0.06)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
              <Bar dataKey="occupancy" fill="#4FD8E0" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Room Popularity" description="Bookings by suite, last 90 days">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roomPopularity} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="rgba(237,230,214,0.06)" horizontal={false} />
              <XAxis type="number" stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="rgba(237,230,214,0.5)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="bookings" fill="#9F8146" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

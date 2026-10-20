import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { BedDouble, DoorOpen, LogIn, LogOut, IndianRupee, Percent, Sparkles } from 'lucide-react'
import { DashboardCard, ChartCard } from '../../components/dashboard/DashboardWidgets'
import { LoadingState } from '../../components/common/States'
import { adminService } from '../../services/adminService'

const chartTooltipStyle = {
  background: '#14120F',
  border: '1px solid rgba(198,166,100,0.25)',
  fontSize: 12,
  fontFamily: 'Manrope, sans-serif',
  color: '#EDE6D6',
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    adminService.getOverview().then(setData)
  }, [])

  if (!data) return <LoadingState label="Loading house operations." />

  const { kpis, revenueTrend, occupancyTrend, roomPopularity } = data

  return (
    <div className="space-y-10">
      <div>
        <span className="eyebrow">House Operations</span>
        <h1 className="display-md mt-2">Overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total Rooms" value={kpis.totalRooms} icon={BedDouble} />
        <DashboardCard label="Available" value={kpis.available} icon={DoorOpen} />
        <DashboardCard label="Today's Check-ins" value={kpis.todayCheckIns} icon={LogIn} />
        <DashboardCard label="Today's Check-outs" value={kpis.todayCheckOuts} icon={LogOut} />
        <DashboardCard
          label="Revenue (MTD)"
          value={`₹${(kpis.revenueMTD / 100000).toFixed(1)}L`}
          icon={IndianRupee}
          tone="signal"
        />
        <DashboardCard label="Occupancy Rate" value={`${kpis.occupancyRate}%`} icon={Percent} />
        <DashboardCard label="Occupied" value={kpis.occupied} icon={BedDouble} />
        <DashboardCard
          label="AI Insight"
          value="+12%"
          icon={Sparkles}
          hint="Projected weekend uplift"
          tone="signal"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ChartCard title="Revenue Trend" description="Last 6 months, in ₹">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C6A664" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#C6A664" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(237,230,214,0.06)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Area type="monotone" dataKey="revenue" stroke="#C6A664" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Booking Trend" description="Reservations per month">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="bookingsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4FD8E0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4FD8E0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(237,230,214,0.06)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="bookings" stroke="#4FD8E0" strokeWidth={2} fill="url(#bookingsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Occupancy" description="Percentage occupied by day">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={occupancyTrend}>
              <CartesianGrid stroke="rgba(237,230,214,0.06)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(237,230,214,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
              <Bar dataKey="occupancy" fill="#C6A664" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Room Popularity" description="Bookings by suite, last 90 days">
          <ResponsiveContainer width="100%" height={240}>
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

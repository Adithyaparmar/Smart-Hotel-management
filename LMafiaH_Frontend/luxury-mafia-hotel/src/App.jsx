import { Routes, Route } from 'react-router-dom'

import Layout from './components/layout/Layout'
import DashboardLayout from './components/layout/DashboardLayout'
import AdminLayout from './components/layout/AdminLayout'

import Home from './pages/Home'
import RoomsExplorer from './pages/RoomsExplorer'
import RoomDetails from './pages/RoomDetails'
import Booking from './pages/Booking'
import Payment from './pages/Payment'
import Confirmation from './pages/Confirmation'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Experiences from './pages/Experiences'
import Dining from './pages/Dining'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import AIConcierge from './pages/AIConcierge'
import StaffDashboard from './pages/StaffDashboard'

import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerBookings from './pages/customer/CustomerBookings'
import CustomerProfile from './pages/customer/CustomerProfile'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRooms from './pages/admin/AdminRooms'
import AdminBookings from './pages/admin/AdminBookings'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminStaff from './pages/admin/AdminStaff'
import AdminAnalytics from './pages/admin/AdminAnalytics'

// Small helper so every public/marketing page shares the same
// Navbar + Footer + custom cursor + page-transition chrome without
// each page having to import Layout itself.
const withLayout = (element) => <Layout>{element}</Layout>

export default function App() {
  return (
    <Routes>
      {/* ---------- Public site ---------- */}
      <Route path="/" element={withLayout(<Home />)} />
      <Route path="/rooms" element={withLayout(<RoomsExplorer />)} />
      <Route path="/rooms/:id" element={withLayout(<RoomDetails />)} />
      <Route path="/experiences" element={withLayout(<Experiences />)} />
      <Route path="/dining" element={withLayout(<Dining />)} />
      <Route path="/about" element={withLayout(<About />)} />
      <Route path="/contact" element={withLayout(<Contact />)} />

      {/* ---------- Booking flow ---------- */}
      <Route path="/booking" element={withLayout(<Booking />)} />
      <Route path="/booking/payment" element={withLayout(<Payment />)} />
      <Route path="/booking/confirmation" element={withLayout(<Confirmation />)} />

      {/* ---------- Auth ---------- */}
      <Route path="/login" element={withLayout(<Login />)} />
      <Route path="/register" element={withLayout(<Register />)} />
      <Route path="/forgot-password" element={withLayout(<ForgotPassword />)} />

      {/* ---------- AI Concierge (immersive, own chrome, no footer) ---------- */}
      <Route path="/ai-concierge" element={<AIConcierge />} />

      {/* ---------- Staff operations (own chrome) ---------- */}
      <Route path="/staff" element={<StaffDashboard />} />

      {/* ---------- Customer portal ---------- */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<CustomerDashboard />} />
        <Route path="bookings" element={<CustomerBookings />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="saved" element={<CustomerDashboard />} />
        <Route path="notifications" element={<CustomerDashboard />} />
      </Route>

      {/* ---------- Admin / house operations ---------- */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* ---------- 404 ---------- */}
      <Route path="*" element={withLayout(<NotFound />)} />
    </Routes>
  )
}

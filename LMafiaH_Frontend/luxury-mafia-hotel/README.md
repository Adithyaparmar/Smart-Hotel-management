# Luxury Mafia Hotel — Frontend

A premium, futuristic hotel booking and management platform. Old-money Italian
hospitality, styled with restraint, paired with an AI concierge. This repo is
the **complete frontend** — 25 routes, full booking flow, customer/staff/admin
portals, and an AI concierge interface — built on realistic mock data and
service layers that are structured to be swapped for real APIs later.

> The "mafia" identity is a purely fictional, aesthetic brand concept —
> power, privacy, and old-money exclusivity. No weapons, violence, or
> gangster imagery anywhere in the product.

## Tech stack

- React 18 + Vite
- Tailwind CSS (custom design tokens — see `tailwind.config.js`)
- React Router v6
- Framer Motion
- Lucide React (icons)
- Recharts (admin analytics)

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build     # production build to /dist
npm run preview   # preview the production build locally
```

## Project structure

```
src/
  components/
    common/       Button, Badge, Input, Select, Modal, SectionHeading,
                   LoadingState/EmptyState/ErrorState, CustomCursor,
                   PageTransition, Counter (scroll-triggered count-up)
    layout/        Navbar, Footer, Layout, DashboardLayout, AdminLayout
    home/          Hero, BookingWidget, BrandStory, RoomShowcase,
                   Experiences/Dining sections, AI Concierge preview,
                   Testimonials, Location, Newsletter
    rooms/         RoomCard, RoomGrid, RoomGallery, AmenityList
    ai/            AIChat, AIMessage, AIRecommendation (used on the
                   homepage preview AND the full /ai-concierge page)
    dashboard/     DashboardCard, ChartCard, DataTable, NotificationPanel,
                   Sidebar (shared by customer + admin portals)
  pages/           One file per route (see Routes below)
    customer/      /dashboard/* pages
    admin/         /admin/* pages
  context/         AuthContext (mock session), BookingContext (search →
                   room → guest details → payment → confirmation state,
                   shared across the whole booking flow)
  services/        authService, roomService, bookingService, paymentService,
                   userService, adminService, aiService — all mock, all
                   async (simulated latency), all documented with the real
                   endpoint they'll call once the backend exists
  data/            Mock content: rooms, experiences, dining, testimonials,
                   bookings, customers, staff, payments, notifications,
                   analytics, AI conversation starters
```

## Routes implemented

Public: `/`, `/rooms`, `/rooms/:id`, `/experiences`, `/dining`, `/about`,
`/contact`, `/ai-concierge`, `/staff`

Booking flow: `/booking` (room → guest details → review),
`/booking/payment`, `/booking/confirmation`

Auth: `/login`, `/register`, `/forgot-password`

Customer portal (`DashboardLayout`, sidebar nav):
`/dashboard`, `/dashboard/bookings`, `/dashboard/profile`

Admin / house operations (`AdminLayout`, sidebar nav):
`/admin`, `/admin/rooms`, `/admin/bookings`, `/admin/customers`,
`/admin/staff`, `/admin/analytics`

Fallback: `*` → 404

## What's implemented

- Cinematic homepage: hero with staggered text reveal, floating booking
  console, brand story with animated counters, six-suite showcase,
  experiences + dining sections, AI concierge live-session preview,
  testimonials, location, newsletter
- Room discovery: filter by type/guests, sort by price, room detail page
  with image gallery, amenities, sticky booking panel (desktop) / sticky
  CTA (mobile)
- Full booking flow with shared state across steps: room → guest details
  (validated) → review → mock payment (card/UPI/net banking/wallet) →
  animated confirmation screen
- Auth screens: login, register (with validation states), forgot password
- AI Concierge: chat UI with suggested prompts, typing indicator, tool/
  status line, and room recommendation cards — mock keyword matching
  simulates budget/guest-count/amenity-aware search
- Customer portal: overview, saved suites, notifications, bookings by
  status (upcoming/active/past/cancelled), profile + preferences
- Staff dashboard: today's check-ins/outs, room status board, tasks,
  guest requests
- Admin: KPI overview with revenue/occupancy/booking-source charts, room
  inventory management, reservation status workflow (confirm → check-in →
  check-out / cancel), customer directory with booking history, staff
  roster, dedicated analytics page
- Custom cursor (desktop only), floating/scroll-aware navbar with animated
  mobile menu, page transitions, scroll-reveal and count-up animations
  throughout
- Loading / empty / error states used consistently instead of blank
  screens

## Limitations — this is frontend only

Every service in `src/services/` is a mock with a documented real endpoint
in its file header. Nothing here talks to a real backend, database, or
payment processor. Specifically:

- No real authentication, sessions, or password hashing (login/register
  return a mock user object)
- No real payment processing (Payment page is structured for a future
  Razorpay integration; no card data is transmitted anywhere)
- No persistence — refreshing the page resets all state; "saved" data
  (bookings, staff, room status changes made in admin) lives only in
  memory
- Search/availability/AI responses are simulated with local keyword
  matching, not a real LLM or database query

## What backend/AI integration would add later

```
React → Node.js → Express.js → PostgreSQL       (core app + auth + bookings)
React → Node API → Python AI Microservice → LLM
        → Tool Calling / RAG / Memory → Hotel APIs → PostgreSQL
```

- JWT auth + role-based access control (customer / staff / admin)
- Real room/availability/booking/payment persistence
- Razorpay (or similar) payment integration
- The Consigliere backed by an actual LLM with tool calling for room
  search, availability, and booking; RAG over hotel policy/FAQ content;
  per-guest memory and personalization
- Real analytics computed from live booking/payment data

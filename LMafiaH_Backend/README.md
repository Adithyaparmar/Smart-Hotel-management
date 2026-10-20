# Luxury Mafia Hotel — Backend

Production-oriented backend for **Luxury Mafia Hotel**, a premium hotel booking and
management platform with an AI concierge, **The Consigliere**. This repository is the
**source of truth** for authentication, authorization, rooms, pricing, bookings,
payments, check-in/out, notifications, analytics, staff/admin operations, and every
AI-driven action. It is built to be connected to an existing, separately-designed
frontend via clean REST APIs — no frontend code lives here.

```
Frontend (existing, not in this repo)
        │  REST (JSON)
        ▼
Node.js / Express backend  ──────────────►  PostgreSQL (Prisma ORM)
        │        │                                   ▲
        │        └─────────► Redis (rate limiting /  │
        │                     session-adjacent data)  │
        │                                              │
        │  REST (server-to-server, internal key)       │
        ▼                                              │
Python / FastAPI AI service ("The Consigliere")         │
        │  RAG retrieval + LLM reasoning                │
        │  (never touches Postgres directly) ────► calls back into Node's
                                                     internal tool endpoints,
                                                     which execute against
                                                     PostgreSQL on the AI's
                                                     behalf, under the same
                                                     authorization rules as
                                                     the public REST API.
```

---

## 1. Final architecture

- **API layer**: Express.js, REST, JSON envelope (`{ success, data, message }` /
  `{ success: false, message, code }`) on every route.
- **Data layer**: PostgreSQL via Prisma ORM. Single shared `PrismaClient` instance.
  Every write that must be atomic (booking creation, payment confirmation,
  check-in/out, cancellation) runs inside a Prisma `$transaction`.
- **Auth**: JWT access tokens (short-lived, 15m default) + rotating refresh tokens
  (httpOnly cookie, 30d default, hashed at rest, revoked on rotation/logout).
  Passwords hashed with Argon2id.
- **Authorization**: coarse RBAC (`CUSTOMER` / `STAFF` / `ADMIN` / `SUPER_ADMIN`)
  enforced in Express middleware from `req.user`, which is re-derived from the
  database on every request — the frontend's claimed role is never trusted.
  A `Role`/`Permission`/`RolePermission` schema also exists for fine-grained,
  data-driven permission checks (seeded, ready for an admin permissions UI).
- **Booking engine**: real availability/pricing/concurrency logic, not CRUD — see
  §3 and `src/services/booking.service.js`.
- **Payments**: provider-abstracted (`src/services/paymentProviders`) — Razorpay in
  production, an explicit `MockPaymentProvider` in development when credentials are
  absent. The mock never pretends a real charge occurred.
- **Real-time**: Socket.IO, JWT-authenticated handshake, per-user private rooms and
  role rooms (`staff-and-admin`, `admin`) for live notifications and operational
  dashboards.
- **Background jobs**: `node-cron` — releasing expired unpaid booking holds (every
  5 minutes) and check-in/check-out reminders (daily).
- **AI service**: separate Python/FastAPI microservice. The LLM never has a
  database connection; every fact/action it needs is a controlled tool call that
  routes back through this Node backend's internal, authenticated endpoint
  (`/api/internal/ai/tools/run`), which re-applies normal authorization.
- **Security**: Helmet, CORS locked to `CLIENT_URL`, rate limiting (global +
  stricter on auth endpoints), Zod validation on every input, centralized error
  handling that never leaks internals, audit logging for sensitive actions,
  secrets only ever read from environment variables.

---

## 2. Folder structure

```
backend/
├── src/
│   ├── config/           env.js, database.js (Prisma client), redis.js
│   ├── controllers/      thin HTTP handlers — one file per domain
│   ├── routes/           Express routers, wire validation + auth + RBAC
│   ├── services/         business logic (the real engine lives here)
│   │   └── paymentProviders/   provider interface, Razorpay, Mock, factory
│   ├── repositories/     (reserved — most domains query Prisma directly from
│   │                      services; split out here if a domain's queries grow)
│   ├── middleware/        auth, rbac, validate, errorHandler, rateLimit, auditLog
│   ├── validators/       Zod schemas per domain
│   ├── utils/            AppError, ApiResponse, asyncHandler, tokens, password...
│   ├── sockets/           Socket.IO server + room/booking event emitters
│   ├── jobs/              cron jobs (expired holds, reminders)
│   └── app.js             Express app wiring
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── tests/                 Jest + Supertest
├── .env.example
├── package.json
├── server.js               entrypoint (HTTP server + Socket.IO + cron)
└── README.md

ai-service/
├── app/
│   ├── api/                FastAPI routers (chat/orchestrate)
│   ├── agents/              orchestrator — the agentic loop + tool-calling
│   ├── tools/                tool schemas + the HTTP client back to Node
│   ├── rag/                  chunking, embeddings, vector store, retrieval
│   ├── memory/                non-sensitive preference memory client
│   ├── models/                 Pydantic schemas
│   ├── services/                LLM client, Node backend client
│   └── main.py
├── requirements.txt
└── README.md
```

---

## 3. Database schema summary

Core tables (see `prisma/schema.prisma` for full detail — relations, indexes,
cascade rules):

- **Auth/RBAC**: `User`, `Role`, `Permission`, `RolePermission`, `RefreshToken`,
  `PasswordResetToken`, `AuditLog`
- **People**: `CustomerProfile`, `StaffProfile`
- **Inventory**: `RoomType`, `Amenity`, `Room`, `RoomAmenity`
- **Bookings**: `Booking`, `BookingGuest`, `BookingStatusHistory`
- **Payments**: `Payment`, `PaymentTransaction`, `Refund`
- **Staff ops**: `StaffTask`
- **Notifications**: `Notification`
- **Reviews**: `Review` (unique on `bookingId` — one review per completed stay)
- **Settings**: `HotelSetting` (flexible key/value store, JSON value)
- **AI**: `AIConversation`, `AIMessage`, `AIMemory`

Key design decisions:
- `Booking.checkInDate`/`checkOutDate` use a half-open interval `[in, out)` —
  checkout day is free for a new check-in the same day.
- `Booking.priceBreakdown` (JSON) snapshots the full itemized price calculation at
  booking time, alongside normalized `roomSubtotal`/`taxAmount`/etc. columns for
  fast aggregation in analytics.
- Double-booking prevention: `@@index([roomId, checkInDate, checkOutDate])` plus a
  **Serializable** transaction that re-checks for overlapping bookings inside the
  same transaction that inserts the new one (see §4).
- `Review.bookingId` is `@unique`, which is what actually enforces "one review per
  stay" at the database level, not just in application code.
- `AIMemory` is scoped to non-sensitive categories only
  (`ROOM_PREFERENCE`, `VIEW_PREFERENCE`, `HOSPITALITY_PREFERENCE`,
  `CONVERSATION_CONTEXT`, `OTHER`) — enforced in `aiTools.service.js`.

---

## 4. The booking engine (not CRUD)

`src/services/booking.service.js#createBooking` runs the full flow inside one
`SERIALIZABLE` Prisma transaction:

1. Re-fetch the room and assert it's active and not under maintenance.
2. Re-run the overlap query for the requested dates **inside the transaction**.
3. Validate party size against room capacity.
4. Calculate price **server-side** (`pricing.service.js`) — the client never
   supplies a total.
5. Insert the booking (`PENDING`) + guests + a status-history row, and soft-hold
   the room (`RESERVED`) so it stops appearing as available.

If two requests race for the same room/dates, Postgres either serializes them so
the second sees the first's row via the transaction-scoped re-check, or raises a
serialization failure (`P2034`) that we translate into a clean `409
ROOM_ALREADY_BOOKED` instead of a 500. A background job
(`jobs/releaseExpiredHolds.job.js`) cancels stale `PENDING` holds after 20 minutes
and frees the room, so an abandoned checkout doesn't lock inventory forever.

Booking ⇄ room status stay synchronized on every transition:

```
create (PENDING)        → room: RESERVED
payment verified         → booking: CONFIRMED   (room stays RESERVED)
staff check-in            → booking: CHECKED_IN   → room: OCCUPIED
staff check-out             → booking: CHECKED_OUT → room: CLEANING (+ a
                                                       housekeeping task; staff
                                                       must explicitly mark the
                                                       room AVAILABLE again)
cancellation                → booking: CANCELLED   → room: AVAILABLE
```

---

## 5. API documentation

All responses follow:
```json
// success
{ "success": true, "data": {}, "message": "..." }
// error
{ "success": false, "message": "Human-readable error", "code": "ERROR_CODE" }
```

### Auth — `/api/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | — | creates a `CUSTOMER` |
| POST | `/login` | — | sets refresh-token httpOnly cookie, returns access token |
| POST | `/refresh` | — (cookie or body) | rotates refresh token |
| POST | `/logout` | — | revokes the refresh token |
| POST | `/forgot-password` | — | never reveals if an email exists |
| POST | `/reset-password` | — | consumes a one-time token |
| POST | `/change-password` | ✓ | revokes all other sessions |
| GET/PATCH | `/me` | ✓ | profile |

### Users — `/api/users` (ADMIN+)
`GET /`, `PATCH /:id/status`

### Rooms — `/api/rooms`
| Method | Path | Auth |
|---|---|---|
| GET | `/` `/:id` `/availability` | public |
| POST `/`, PATCH `/:id`, DELETE `/:id` | ADMIN+ |
| PATCH `/:id/status` | STAFF+ |

### Room types — `/api/room-types`, Amenities — `/api/amenities`
Public read, ADMIN+ write.

### Bookings — `/api/bookings`
| Method | Path | Auth |
|---|---|---|
| POST | `/quote` | ✓ — server-computed price preview |
| POST | `/` | CUSTOMER |
| GET | `/my` | CUSTOMER |
| GET | `/` | STAFF+ |
| GET | `/:id` | ✓ (owner or STAFF+) |
| PATCH | `/:id/cancel` | ✓ (owner or STAFF+) |
| POST | `/:id/check-in`, `/:id/check-out` | STAFF+ |

### Payments — `/api/payments`
`POST /create-order`, `POST /verify` (✓), `POST /webhook` (Razorpay-signed, raw body)

### Staff — `/api/staff`
`GET /dashboard`, `/check-ins/today`, `/check-outs/today`, `/tasks` (STAFF+);
`POST /`, `GET /` staff provisioning (ADMIN+)

### Admin — `/api/admin`, Analytics — `/api/analytics` (ADMIN+)
Dashboard, customers, revenue/booking-trends/room-popularity/average-booking-value/ai-insights

### Notifications — `/api/notifications` (✓)
### Reviews — `/api/reviews`
`GET /room/:roomId` public; create/update/delete (CUSTOMER, own + eligible);
`POST /:id/respond` (STAFF+)

### Hotel settings — `/api/hotel-settings`
`GET /` public, `PUT /` SUPER_ADMIN

### AI — `/api/ai`
`POST /chat`, `GET /conversations`, `GET /conversations/:id`,
`PATCH /conversations/:id/close`, `GET /memory`, `DELETE /memory/:key`

### Internal (server-to-server only, never expose publicly) — `/api/internal`
`POST /ai/tools/run`, `POST /ai/memory`, `GET /ai/memory/:userId` — guarded by
`x-internal-key`, called only by the FastAPI AI service.

---

## 6. Environment variables

See `.env.example` for the full list with defaults/comments. Highlights:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets — set real random values in any non-local environment |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | leave blank in dev to auto-use the mock provider |
| `AI_SERVICE_URL` / `AI_SERVICE_INTERNAL_KEY` | how Node reaches the FastAPI service, and the shared secret for the reverse (internal) direction |
| `TAX_RATE_PERCENT` / `SERVICE_CHARGE_PERCENT` | pricing engine defaults |

---

## 7. Setup commands

```bash
cd backend
cp .env.example .env        # fill in real values
npm install
```

## 8. Migration commands

```bash
npx prisma generate
npx prisma migrate dev --name init      # creates the DB schema locally
# production:
npx prisma migrate deploy
```

## 9. Seed commands

```bash
npm run seed
# or: npx prisma db seed
```

Creates roles/permissions, hotel settings, 1 super admin, 1 admin, 3 staff, 4
customers, 4 room types with 11 rooms, 12 amenities, and a handful of bookings in
different lifecycle states (with payments/reviews where applicable).

**Development credentials** (all seeded accounts share one password):

| Role | Email | Password |
|---|---|---|
| SUPER_ADMIN | `donvittorio@luxurymafiahotel.com` | `Omerta#2026` |
| ADMIN | `admin@luxurymafiahotel.com` | `Omerta#2026` |
| STAFF | `frontdesk@luxurymafiahotel.com`, `concierge@luxurymafiahotel.com`, `housekeeping@luxurymafiahotel.com` | `Omerta#2026` |
| CUSTOMER | `giovanni.rossi@example.com`, `isabella.romano@example.com`, `marco.deluca@example.com`, `aria.chen@example.com` | `Omerta#2026` |

These are **development-only** credentials — rotate/remove before any real deployment.

## 10. Test commands

```bash
npm test
```

Tests are written against mocked Prisma clients (`jest.doMock('../src/config/database', ...)`)
so the full suite runs without a live Postgres instance, while still exercising
real business logic: registration/login (incl. password hashing and duplicate
rejection), RBAC middleware (role gating + ownership + never trusting a
client-supplied role), room availability/double-booking prevention (including a
simulated Postgres serialization conflict), booking creation and capacity
validation, price calculation (nights, tax, service charge, discount codes),
cancellation eligibility and refund routing, check-in/check-out state machine
validation, and admin-route authorization end-to-end via Supertest.

## 11. AI setup requirements

See `ai-service/README.md` for full detail. In short:

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set an LLM API key + the same AI_SERVICE_INTERNAL_KEY as the Node backend
uvicorn app.main:app --reload --port 8000
```

The AI service needs:
- An LLM provider API key (the client is provider-agnostic — see `app/services/llm_client.py`).
- `NODE_BACKEND_URL` and `INTERNAL_SERVICE_KEY` matching the Node backend's
  `AI_SERVICE_URL`/`AI_SERVICE_INTERNAL_KEY`, so the two services can call each
  other server-to-server.
- No direct database credentials — by design, this service never connects to
  PostgreSQL.

## 12. Payment setup requirements

- Without any Razorpay credentials, the backend automatically uses
  `MockPaymentProvider` — the full booking → order → verify → confirm flow works
  end-to-end with no external account, and every mock artifact is clearly
  namespaced (`mock_order_*`, `mock_pay_*`) so it can never be mistaken for a real
  charge.
- For real payments: create a Razorpay account, set `RAZORPAY_KEY_ID` /
  `RAZORPAY_KEY_SECRET` in `.env`, and configure a webhook in the Razorpay
  dashboard pointing at `POST /api/payments/webhook` with `RAZORPAY_WEBHOOK_SECRET`
  set to the signing secret shown there. The webhook path is intentionally
  mounted with `express.raw()` (not JSON-parsed) because Razorpay's HMAC
  signature is computed over the raw request body.

## External services / credentials required for a full production deployment

- PostgreSQL instance
- Redis instance
- Razorpay account (or continue using the mock provider in non-production)
- SMTP provider for transactional email (booking confirmations, password resets,
  reminders) — `nodemailer`-compatible
- An LLM provider account for the AI service
- (Optional, for the RAG pipeline) a vector database — the AI service ships with
  an in-memory/file-backed store for local development; swap in a managed vector
  DB (pgvector, Pinecone, Qdrant, etc.) for production — see `ai-service/README.md`.

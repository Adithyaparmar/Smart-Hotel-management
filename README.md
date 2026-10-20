<div align="center">

# 🏨 Luxury Mafia Hotel

### Smart Hotel Management Platform with an AI-Powered Concierge

**Luxury hospitality. Intelligent automation. Seamless management.**

A full-stack hotel management platform combining room reservations, guest services, administrative operations, and an AI-powered hotel concierge called **The Consigliere**.

[![React](https://img.shields.io/badge/React-2026-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-AI_Service-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

**Repository:** [Smart-Hotel-management](https://github.com/Adithyaparmar/Smart-Hotel-management)

</div>

---

## 📌 Overview

**Luxury Mafia Hotel** is a full-stack smart hotel management system designed to simplify hotel operations while delivering a premium guest experience.

The platform combines a modern React frontend, a Node.js and Express backend, a PostgreSQL database, and a Python-based AI microservice.

Its AI concierge, **The Consigliere**, uses Google Gemini and controlled backend tools to answer hotel-related questions and retrieve real hotel information.

Rather than allowing the AI model to access the database directly, the system routes operational requests through the Node.js backend, where authorization and business logic are enforced.

The project focuses on three core areas:

- **Guest experience:** Room discovery, availability searches, reservations, and customer dashboards.
- **Hotel operations:** Room management, bookings, staff operations, and administrative dashboards.
- **Intelligent assistance:** An AI concierge connected to hotel services through controlled tools.

The application is currently under active development, with additional testing, feature completion, security hardening, and deployment planned.

## ✨ Key Features

### 🛏️ Room Discovery and Management

- Explore hotel rooms and suites.
- View room details, descriptions, pricing, amenities, and capacity.
- Search and filter rooms.
- Check availability for selected dates.
- Retrieve room information from the backend.
- Manage room records and operational status through administrative functionality.

### 📅 Booking Management

- Search for available rooms.
- Validate check-in and check-out dates.
- Check room availability and guest capacity.
- Calculate booking prices on the backend.
- Create and retrieve customer bookings.
- Support booking cancellation.
- Provide administrative booking management.
- Support staff check-in and check-out operations.

The backend is responsible for validating booking requests and calculating prices rather than trusting final totals supplied by the frontend.

### 🔐 Authentication and Authorization

- User authentication using JWT-based access tokens.
- Refresh-token support.
- Role-based access control.
- Protected backend routes.
- Separate access levels for customers, staff, administrators, and super administrators.
- Backend authorization for sensitive operations.

### 🤖 The Consigliere — AI Hotel Concierge

The Consigliere is the AI-powered assistant integrated into the platform.

It uses Google Gemini through a dedicated Python/FastAPI service and can invoke controlled hotel-management tools through the Node.js backend.

Supported AI tools include:

- `searchRooms`
- `checkAvailability`
- `getRoomDetails`
- `calculateBookingPrice`
- `getHotelInformation`
- `getHotelPolicies`
- `getUserBookings`
- `getBookingStatus`
- `createBooking`
- `cancelBooking`

The assistant is designed to help guests discover rooms, understand hotel policies, check availability, retrieve booking information, and initiate supported booking operations.

Sensitive actions, including booking creation and cancellation, require appropriate confirmation and backend authorization.

**Security principle:** The language model does not receive direct database access. Hotel operations are performed through controlled backend tools.

### 💳 Payment Integration

- Backend payment endpoints.
- Payment-order creation and verification flow.
- Payment-provider abstraction.
- Development mock-payment support when real payment credentials are unavailable.

Real payment processing must be configured and tested with the selected payment provider before the platform is used for actual transactions.

### 🛡️ Administrative Dashboard

Administrative functionality includes:

- Hotel overview.
- Room management.
- Booking management.
- Customer information.
- Staff management.
- Analytics and operational reporting.

Some administrative screens and analytics components still require additional backend integration and verification.

### 👨‍💼 Staff Operations

Staff-related functionality includes:

- Staff dashboard.
- Today's check-ins and check-outs.
- Room-status management.
- Task-management endpoints.
- Operational access based on user roles.

Notification functionality and remaining staff workflows are part of ongoing development.

### 🖥️ Modern Frontend

The frontend uses React, Vite, Tailwind CSS, Framer Motion, Lucide icons, and Recharts.

The interface is designed around a premium hospitality experience, with dedicated customer-facing room discovery, booking interfaces, dashboards, and the AI concierge.

---

## 🏗️ System Architecture

The application follows a layered architecture that separates presentation, business logic, database operations, and AI orchestration.

```text
                         ┌────────────────────────┐
                         │       Guest / Staff    │
                         │      Administrator     │
                         └────────────┬───────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │      React Frontend    │
                         │   Vite + Tailwind CSS  │
                         └────────────┬───────────┘
                                      │
                                REST API
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │    Node.js + Express   │
                         │ Authentication / RBAC  │
                         │ Hotel Business Logic   │
                         └────────────┬───────────┘
                                      │
                         ┌────────────┴─────────────┐
                         │                          │
                         ▼                          ▼
              ┌────────────────────┐     ┌────────────────────┐
              │    PostgreSQL      │     │  Python / FastAPI   │
              │  Prisma ORM        │     │  AI Microservice    │
              └────────────────────┘     └─────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌────────────────────┐
                                        │  AI Orchestrator   │
                                        │  Tool Selection    │
                                        └─────────┬──────────┘
                                                  │
                                                  ▼
                                        ┌────────────────────┐
                                        │    Google Gemini   │
                                        └─────────┬──────────┘
                                                  │
                                           Tool requests
                                                  │
                                                  ▼
                                        ┌────────────────────┐
                                        │ Controlled Hotel   │
                                        │ Backend Tools      │
                                        └─────────┬──────────┘
                                                  │
                                                  ▼
                                        ┌────────────────────┐
                                        │ Authorized Backend │
                                        │ Operations / Data  │
                                        └────────────────────┘
```

### Architecture Principles

1. The frontend communicates with the Node.js backend through REST APIs.
2. The Node.js backend handles authentication, authorization, validation, and hotel business logic.
3. PostgreSQL stores persistent application data.
4. The Python AI service orchestrates conversations and interactions with the language model.
5. AI tools call internal backend endpoints rather than connecting directly to PostgreSQL.
6. Sensitive hotel operations must be validated and authorized by the backend.

---

## 🧰 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Frontend tooling | Vite | Development server and build tooling |
| Styling | Tailwind CSS | Responsive interface styling |
| Animation | Framer Motion | UI animations |
| Icons | Lucide React | Interface icons |
| Charts | Recharts | Dashboard visualizations |
| Backend | Node.js | Server-side runtime |
| API framework | Express.js | REST API and middleware |
| ORM | Prisma | Database access and data modeling |
| Database | PostgreSQL | Persistent application data |
| Authentication | JWT | Access-token authentication |
| AI service | Python | AI microservice |
| AI framework | FastAPI | AI service API |
| Language model | Google Gemini | Natural-language understanding and generation |
| HTTP communication | REST / HTTPX / Axios | Service-to-service communication |
| Version control | Git and GitHub | Source control |

---

## 📁 Project Structure

The repository is organized into three main application components.

```text
Smart-Hotel-management/
│
├── LMafiaH_Frontend/
│   └── luxury-mafia-hotel/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── context/
│       │   ├── data/
│       │   ├── pages/
│       │   ├── services/
│       │   └── ...
│       ├── package.json
│       ├── vite.config.js
│       └── tailwind.config.js
│
├── LMafiaH_Backend/
│   ├── prisma/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   ├── package.json
│   └── server.js
│
├── AI-Service/
│   ├── app/
│   │   ├── agents/
│   │   ├── api/
│   │   ├── rag/
│   │   ├── services/
│   │   └── tools/
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
└── README.md
```

The exact contents of individual directories may evolve as development continues.

---

## ⚙️ Getting Started

Follow these instructions to run the platform locally.

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Python](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Git](https://git-scm.com/)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

Use compatible software versions for the project's installed dependencies.

### 1. Clone the Repository

```bash
git clone https://github.com/Adithyaparmar/Smart-Hotel-management.git
cd Smart-Hotel-management
```

### 2. Configure PostgreSQL

Make sure PostgreSQL is running locally or that you have access to a configured PostgreSQL instance.

Create a database for the application, then configure the backend environment variables using the variable names expected by the backend configuration.

For example, a PostgreSQL connection URL commonly follows this format:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME"
```

Replace the placeholders with your actual database credentials.

Do not commit real database credentials to GitHub.

### 3. Set Up the Backend

Open a terminal:

```bash
cd LMafiaH_Backend
npm install
```

Create a local `.env` file using the variables required by the backend's environment configuration.

Configure the database connection, authentication secrets, AI-service URL, internal service key, CORS settings, and any other required application settings.

If the project provides Prisma scripts for migrations or database seeding, review `package.json` before running them. Do not reseed an existing database without understanding whether the seed script modifies existing data.

Start the backend:

```bash
npm run dev
```

The backend has been configured to use port `5000` in the local development setup.

### 4. Set Up the AI Service

Open a separate terminal:

```bash
cd AI-Service
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Configure the AI service's local `.env` file with the required settings, including:

```env
GEMINI_API_KEY=your_gemini_api_key
LLM_MODEL=gemini-3.1-flash-lite
INTERNAL_SERVICE_KEY=your_shared_internal_service_key
NODE_BACKEND_URL=http://localhost:5000
```

These are example local-development settings. Confirm the expected names and values in the current AI service configuration before using them.

**Important:** The internal service key configured for the AI service must match the value expected by the Node backend. Use a private value outside this example rather than relying on a publicly documented development key.

Start FastAPI:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The AI service should now be available at:

```text
http://localhost:8000
```

Interactive API documentation may be available at:

```text
http://localhost:8000/docs
```

### 5. Set Up the Frontend

Open another terminal:

```bash
cd LMafiaH_Frontend/luxury-mafia-hotel
npm install
```

Configure the frontend environment if required:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

Vite typically serves the frontend at:

```text
http://localhost:5173
```

The terminal will display the exact local address.

### Local Service Summary

| Service | Development address |
|---|---|
| React frontend | `http://localhost:5173` |
| Node.js backend | `http://localhost:5000` |
| Python AI service | `http://localhost:8000` |
| FastAPI documentation | `http://localhost:8000/docs` |

Keep all three services running while using features that depend on the complete application.

---

## 🔌 API Overview

The backend exposes REST APIs for the platform's core operations.

The main API groups include:

| API group | Purpose |
|---|---|
| `/api/auth` | Login, registration, and authentication |
| `/api/users` | User-related operations |
| `/api/rooms` | Room details, searches, and availability |
| `/api/bookings` | Booking management |
| `/api/payments` | Payment-order creation and verification |
| `/api/staff` | Staff operations and tasks |
| `/api/admin` | Administrative operations |
| `/api/analytics` | Operational analytics |
| `/api/notifications` | Notification-related functionality |
| `/api/ai` | AI concierge and conversations |

The exact available endpoints and supported methods are defined by the backend route files.

### Example: Retrieve Rooms

```http
GET /api/rooms
```

### Example: Check Room Availability

```http
GET /api/rooms/availability?checkInDate=2026-10-25&checkOutDate=2026-10-27&adults=2&children=0
```

Use future dates when testing availability. The backend validates dates and room capacity according to its implemented rules.

### Example: Send a Message to The Consigliere

```http
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Example request:

```json
{
  "message": "Find me a suite for two people."
}
```

The chat endpoint requires an authenticated user. The exact request schema is defined by the backend validator.

---

## 🤖 How The Consigliere Works

The AI concierge uses a controlled tool-execution architecture.

When a user asks a hotel-related question:

1. The frontend sends the message to the Node.js API.
2. The backend authenticates the user and forwards the request to the Python AI service.
3. The AI orchestrator supplies conversation context and available tool definitions to Gemini.
4. Gemini determines whether a hotel tool is needed.
5. The AI service submits the tool request to the internal Node.js endpoint.
6. The backend validates and authorizes the requested operation.
7. The appropriate hotel service performs the operation and retrieves the required data.
8. The AI orchestrator uses the tool result to generate a response.
9. The frontend displays the response to the user.

For sensitive operations, the system is designed to require confirmation and backend authorization.

### Why This Architecture Matters

This design separates language generation from operational authority.

The AI model can decide which supported action is appropriate, but it does not receive unrestricted database access. The backend remains responsible for executing authorized business operations.

This is particularly important for operations involving reservations, cancellations, prices, and guest data.

---

## 🔒 Security Considerations

Security must be maintained throughout development and deployment.

- Keep API keys and credentials in environment variables.
- Never publish actual `.env` files.
- Never expose database passwords, JWT secrets, or internal service keys to the frontend.
- Use strong, unique secrets for local and production environments.
- Enforce authorization on the backend for protected routes.
- Validate all incoming data.
- Verify payment operations on the backend.
- Do not trust room prices or other sensitive values supplied by the frontend.
- Keep the internal AI service protected by service-to-service authentication.
- Avoid logging access tokens, API keys, payment credentials, or unnecessary sensitive guest data.
- Configure production CORS, HTTPS, rate limits, and secure error handling.
- Test all AI tools against unauthorized access and invalid parameters.

Development credentials must never be reused for production.

---

## 🧪 Testing and Validation

Before deploying the application, test the main customer, administrative, and AI workflows.

### Customer Workflow

- Register and log in.
- Browse rooms.
- Search by dates and guest count.
- Open room details.
- Create a booking.
- Complete the configured payment flow.
- View the booking in the customer dashboard.
- Cancel a booking where permitted.

### Admin and Staff Workflow

- Access protected dashboards using the correct role.
- Review bookings.
- Update room status.
- Perform check-in and check-out operations.
- Verify that booking and room states remain consistent.

### AI Concierge Workflow

- Ask general hotel questions.
- Retrieve room details using room names.
- Search for available rooms.
- Check availability for selected dates.
- Calculate booking prices.
- Retrieve the authenticated customer's bookings.
- Test booking and cancellation confirmation flows.
- Confirm that unauthorized actions are rejected by the backend.
- Test invalid inputs and unavailable rooms.

### Reliability Tests

- Try invalid dates.
- Try an invalid room identifier.
- Test overlapping booking requests.
- Verify that simultaneous requests cannot double-book the same room.
- Test expired access tokens.
- Test invalid internal service keys.
- Test API failure and recovery behavior.

Testing should be repeated after important changes to the booking, authentication, or AI services.

---

## 🗺️ Development Roadmap

The following items represent areas for continued development and verification rather than claims that every feature is already complete.

- [x] React frontend and hotel interface
- [x] Node.js and Express backend
- [x] PostgreSQL integration through Prisma
- [x] JWT-based authentication and role-based authorization
- [x] Room listing and availability APIs
- [x] Booking-management functionality
- [x] Administrative and staff API foundations
- [x] Python/FastAPI AI microservice
- [x] Google Gemini integration
- [x] Controlled AI hotel tools
- [x] Internal backend authentication for AI tool execution
- [ ] Complete end-to-end verification of all customer booking and payment scenarios
- [ ] Finish remaining administrative and staff functionality
- [ ] Complete persistent AI conversation-history functionality
- [ ] Fully verify booking and cancellation confirmation workflows through the AI concierge
- [ ] Complete notification integration
- [ ] Expand automated API, integration, and authorization tests
- [ ] Complete production security review
- [ ] Configure production database and deployment environments
- [ ] Deploy frontend, backend, and AI service
- [ ] Configure domain, HTTPS, monitoring, and backups

---

## 🚀 Deployment

The application is currently documented primarily for local development.

A production deployment should use separate, properly configured environments for:

- **Frontend:** A static hosting service or suitable frontend platform.
- **Backend:** A Node.js-compatible hosting platform.
- **AI service:** A Python/FastAPI-compatible hosting platform.
- **Database:** A managed PostgreSQL instance.

Before public deployment:

1. Configure production environment variables and secrets.
2. Restrict internal AI endpoints to authenticated service-to-service requests.
3. Configure production CORS and HTTPS.
4. Apply and verify database migrations.
5. Test authentication, booking concurrency, payment verification, and cancellation rules.
6. Configure logging, error monitoring, database backups, and recovery procedures.
7. Verify that the complete AI flow works in the deployed environment.

Deployment is not complete until the services have been deployed and tested together.

---

## 👨‍💻 Author

**Adithya Parmar**

GitHub: [@Adithyaparmar](https://github.com/Adithyaparmar)

Project: [Smart-Hotel-management](https://github.com/Adithyaparmar/Smart-Hotel-management)

---

## 📄 License

No license has been specified for this repository yet.

If you intend to allow others to use, modify, and redistribute the project, choose an appropriate open-source license and add its license file to the repository.

Until a license is added, do not assume that the repository grants permission to reuse or redistribute the source code.

---

<div align="center">

### Luxury Mafia Hotel

**A smarter approach to luxury hospitality.**

Built with React, Node.js, PostgreSQL, Python, and Google Gemini.

</div>

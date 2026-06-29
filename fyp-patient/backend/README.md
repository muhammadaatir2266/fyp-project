# DocLink — Patient Backend

Express.js REST API for the DocLink patient portal. Handles authentication, AI chat (via n8n), Retell voice call sessions, appointment booking, doctor reviews, and patient privacy settings.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ / TypeScript |
| Framework | Express 4 |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |
| AI Chat | n8n webhook |
| Voice | Retell SDK |
| Security | Helmet, express-rate-limit, CORS |
| Scheduling | node-cron (data retention) |

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database (shared with doctor and admin backends)

### Installation

```bash
cd fyp-patient/backend
pnpm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:5432/doclink"
JWT_SECRET="a-long-random-secret-min-32-chars"
N8N_CHAT_WEBHOOK_URL="https://your-n8n-instance/webhook/..."
RETELL_API_KEY="key_..."
RETELL_AGENT_ID="agent_..."
FRONTEND_URL="http://localhost:3000"
WEBSITE_URL="http://localhost:3003"
```

### Database

This backend owns the shared database migrations. Run these once before starting any backend:

```bash
pnpm db:generate   # generate Prisma client
pnpm db:migrate    # apply all migrations
pnpm db:seed       # optional — load demo data (dev only)
```

### Development

```bash
pnpm dev   # starts on http://localhost:5000
```

### Production

```bash
pnpm build
pnpm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret (must be set in production) |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `N8N_CHAT_WEBHOOK_URL` | Yes | — | n8n webhook URL for AI chat |
| `RETELL_API_KEY` | Yes | — | Retell API key (starts with `key_`) |
| `RETELL_AGENT_ID` | Yes | — | Retell agent ID (starts with `agent_`) |
| `FRONTEND_URL` | No | `http://localhost:3000` | Patient frontend URL (CORS) |
| `WEBSITE_URL` | No | `http://localhost:3003` | Website URL (CORS + redirects) |
| `APPOINTMENT_TIMEZONE` | No | `Asia/Karachi` | Timezone for slot calculations |
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | Set to `production` to enforce strict secrets |

> In `production`, the server exits at startup if `JWT_SECRET` is not set or is a known default value.

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| POST | `/api/auth/login` | Patient login |
| POST | `/api/auth/signup` | Patient registration |
| GET | `/api/auth/specialties` | List medical specialties |
| POST | `/api/chat/guest/message` | Send message as unauthenticated guest |
| POST | `/api/chat/guest/snapshot` | Save guest chat session snapshot |
| GET | `/api/config/booking` | Booking configuration (timezone, slot size) |

### Authenticated (JWT required — PATIENT role)

#### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Get current user profile |

#### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/guest/claim` | Claim a guest chat session after login |
| POST | `/api/chat/message` | Send chat message to AI assistant |
| GET | `/api/chat/sessions` | List patient's chat sessions |

#### Appointments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/appointments` | List patient appointments |
| GET | `/api/appointments/:id` | Get appointment details |
| POST | `/api/appointments` | Book an appointment |
| POST | `/api/appointments/voice-call` | Start a Retell voice call session |
| POST | `/api/appointments/call-intent` | Create a call booking intent |
| PATCH | `/api/appointments/:id` | Update appointment (cancel / reschedule) |

#### Doctors
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/doctors` | Search doctors |
| GET | `/api/doctors/:id` | Doctor profile |
| GET | `/api/doctors/:id/slots` | Available time slots for a date |
| GET | `/api/doctors/:id/reviews` | Doctor reviews |

#### Profile
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profile` | Get patient profile |
| PUT | `/api/profile` | Update patient profile |
| PUT | `/api/profile/password` | Change password |
| GET | `/api/profile/privacy` | Get privacy settings |
| PUT | `/api/profile/privacy` | Update privacy settings |
| DELETE | `/api/profile/chat-sessions` | Delete all chat sessions |

#### Reviews
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reviews` | Submit a doctor review |

## Authentication Flow

1. Patient signs up or logs in → receives a JWT
2. JWT is stored in `localStorage` and a session cookie is set for Next.js middleware
3. All protected requests include `Authorization: Bearer <token>`
4. Middleware verifies the token and re-checks the `PATIENT` role against the database

## AI Chat Flow

```
Patient message
    │
    ▼
POST /api/chat/message
    │
    ├─ Check patient.shareDataWithAI
    │   └─ If false: strip PHI from payload before forwarding
    │
    ▼
n8n webhook (N8N_CHAT_WEBHOOK_URL)
    │
    ▼
n8n processes + calls OpenAI / recommends doctors
    │
    ▼
Response returned to patient
```

## Voice Call Flow

```
Patient opens voice widget
    │
    ▼
POST /api/appointments/voice-call
    │  creates CallBookingIntent in DB
    ▼
POST Retell.createWebCall (with patientId, doctorId, metadata)
    │
    ▼
Retell agent conducts the call
    │
    ▼
POST /api/v1/doctors/:id/appointments (Admin API — called by Retell)
```

## Privacy Settings

Patients control two privacy flags via `/api/profile/privacy`:

| Flag | Default | Effect |
|------|---------|--------|
| `shareDataWithAI` | `true` | If `false`, PHI is stripped before forwarding to n8n |
| `allowDoctorChatAccess` | `true` | If `false`, doctors cannot view the patient's chat history |

Patients can also delete all their chat history via `DELETE /api/profile/chat-sessions`.

## Security

- **Rate limiting**: `/api/auth/*` → 30 req / 15 min; `/api/chat/*` → 20 req / 1 min
- **Helmet**: sets secure HTTP headers on all responses
- **CORS**: restricted to `FRONTEND_URL` and `WEBSITE_URL`
- **Zod validation**: all request bodies validated before processing
- **bcryptjs**: passwords hashed with 10 salt rounds
- **PHI redaction**: sensitive fields stripped from API logs in production
- **JWT enforcement**: production startup fails if secret is default or missing

## Data Retention Cron

An hourly cron job automatically purges:

| Record | TTL |
|--------|-----|
| `GuestChatSnapshot` | 24 hours |
| `CallBookingIntent` | 30 minutes |
| `ApiLog` | 90 days |

## Database Schema (key models)

| Model | Description |
|-------|-------------|
| `User` | Authentication — email, hashed password, role |
| `Patient` | Profile, medical history, privacy flags |
| `Doctor` | Profile, availability, Google Calendar, ratings |
| `ChatSession` / `ChatMessage` | AI chat history |
| `Appointment` | Bookings with status, source, Google event ID |
| `DoctorReview` | Patient reviews with anonymised `patientInitial` |
| `CallBookingIntent` | Short-lived intent linking a voice call to a patient |
| `GuestChatSnapshot` | Ephemeral anonymous session, expires after 24 h |
| `ApiLog` | Request/response audit log (PHI-redacted) |
| `Specialty` | Medical specialties with aliases |

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Validation error or bad request |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 409 | Conflict (e.g. slot already booked) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

```json
{ "message": "Error description" }
```

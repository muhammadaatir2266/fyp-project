# DocLink — AI Healthcare Platform

DocLink is a multi-portal healthcare platform that connects patients with doctors through AI-assisted chat care, voice calling, online appointment booking, and disease prediction. It consists of seven services organized as a monorepo.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│  Website :3003   Patient :3000   Doctor :3001   Admin :3002 │
└──────┬──────────────┬────────────────┬──────────────┬───────┘
       │              │                │              │
       ▼              ▼                ▼              ▼
  Patient API    Patient API     Doctor API     Admin API
    :5000          :5000           :5001          :4000
       │                              │              │
       │◄─────── PostgreSQL ──────────┘              │
       │          (shared DB)                        │
       │                                             ▼
       ▼                                       ML Service
    n8n Chat                                  Python :5001
    Webhook
       │
       ▼
   Retell Voice
   (webhooks → Doctor API)
```

## Services

| Service | Directory | Port | Description |
|---------|-----------|------|-------------|
| **Patient Frontend** | `fyp-patient/frontend` | 3000 | Patient portal — booking, AI chat, voice calls |
| **Doctor Frontend** | `fyp-doctor/frontend` | 3001 | Doctor dashboard — appointments, patients, availability |
| **Admin Frontend** | `fyp-admin/frontend` | 3002 | Admin panel — doctor verification, API tokens, analytics |
| **Website** | `fyp-website` | 3003 | Marketing site with guest AI chat |
| **Patient Backend** | `fyp-patient/backend` | 5000 | Patient API + n8n chat + Retell voice |
| **Doctor Backend** | `fyp-doctor/backend` | 5001 | Doctor API + Google Calendar + webhook receiver |
| **Admin Backend** | `fyp-admin/backend` | 4000 | Admin API + Calling Agent REST API + ML proxy |
| **ML Service** | `fyp-admin/backend/ml-service` | 5001 | Python FastAPI — CatBoost disease prediction |

> The ML service and doctor backend both default to port `5001`. Run the ML service on a different port in development, or deploy it separately and point `ML_SERVICE_URL` at it.

> **Shared database:** All three Node backends connect to the same PostgreSQL database. Prisma migrations are managed exclusively from `fyp-patient/backend`.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (`npm i -g pnpm`)
- Python 3.8+ (for ML service)
- PostgreSQL database (or Railway/Supabase connection string)

### 1. Database setup (run once from patient backend)

```bash
cd fyp-patient/backend
pnpm install
pnpm db:migrate   # applies all migrations
pnpm db:seed      # optional — loads demo data
```

### 2. Start all services

Open a terminal per service (or use a process manager):

```bash
# Patient backend
cd fyp-patient/backend && pnpm dev

# Patient frontend
cd fyp-patient/frontend && pnpm dev

# Doctor backend
cd fyp-doctor/backend && pnpm dev

# Doctor frontend
cd fyp-doctor/frontend && pnpm dev

# Admin backend
cd fyp-admin/backend && pnpm dev

# Admin frontend
cd fyp-admin/frontend && pnpm dev

# Website
cd fyp-website && pnpm dev

# ML service (separate terminal)
cd fyp-admin/backend/ml-service && python app.py
```

### 3. Demo credentials (after seeding)

| Portal | Email | Password |
|--------|-------|----------|
| Admin | `admin@doclink.com` | `admin123` |
| Doctor | `doctor@example.com` | `doctor123` |
| Patient | `patient@example.com` | `patient123` |

## Environment Variables

Each service needs its own `.env` / `.env.local` file. See each sub-project's README for the full variable list.

### Patient Backend (`fyp-patient/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (min 32 chars in production) |
| `N8N_CHAT_WEBHOOK_URL` | Yes | n8n webhook URL for AI chat |
| `RETELL_API_KEY` | Yes | Retell API key for web voice calls |
| `RETELL_AGENT_ID` | Yes | Retell agent ID |
| `FRONTEND_URL` | No | Patient frontend URL (default: `http://localhost:3000`) |
| `WEBSITE_URL` | No | Website URL (default: `http://localhost:3003`) |
| `APPOINTMENT_TIMEZONE` | No | Timezone for slot logic (default: `Asia/Karachi`) |
| `PORT` | No | Server port (default: `5000`) |

### Doctor Backend (`fyp-doctor/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | Yes | OAuth redirect URI |
| `GOOGLE_TOKEN_ENC_KEY` | Yes | 32-char key for encrypting Google refresh tokens |
| `VAPI_WEBHOOK_SECRET` | Prod | Shared secret for VAPI webhook verification |
| `RETELL_WEBHOOK_SECRET` | Prod | Shared secret for Retell webhook verification |
| `S3_ENDPOINT` | Yes | Cloudflare R2 endpoint URL |
| `S3_ACCESS_KEY_ID` | Yes | R2 access key |
| `S3_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `S3_BUCKET_NAME` | Yes | R2 bucket name |
| `S3_REGION` | No | Region (default: `auto`) |
| `APPOINTMENT_TIMEZONE` | No | Timezone for availability (default: `Asia/Karachi`) |
| `FRONTEND_URL` | No | Doctor frontend URL (default: `http://localhost:3001`) |
| `PORT` | No | Server port (default: `5001`) |

### Admin Backend (`fyp-admin/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing admin JWTs |
| `ML_SERVICE_URL` | Yes | ML service base URL (e.g. `http://127.0.0.1:5001`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (for calendar) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `S3_ENDPOINT` | No | R2 endpoint (for document access) |
| `S3_ACCESS_KEY_ID` | No | R2 access key |
| `S3_SECRET_ACCESS_KEY` | No | R2 secret key |
| `S3_BUCKET_NAME` | No | R2 bucket name |
| `APPOINTMENT_TIMEZONE` | No | Timezone for booking validation (default: `Asia/Karachi`) |
| `FRONTEND_URL` | No | Admin frontend URL |
| `PORT` | No | Server port (default: `4000`) |

### Patient Frontend (`fyp-patient/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Patient backend URL (e.g. `http://localhost:5000/api`) |
| `NEXT_PUBLIC_WEBSITE_URL` | Yes | Website URL for redirects |
| `NEXT_PUBLIC_RETELL_API_KEY` | Yes | Retell public key for browser SDK |

### Doctor Frontend (`fyp-doctor/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Doctor backend URL (e.g. `http://localhost:5001/api`) |
| `NEXT_PUBLIC_WEBSITE_URL` | Yes | Website URL for redirects |

### Admin Frontend (`fyp-admin/frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Admin backend URL (e.g. `http://localhost:4000/api`) |
| `NEXT_PUBLIC_WEBSITE_URL` | No | Website URL for branding links |
| `NEXT_PUBLIC_DOCTOR_API_BASE_URL` | No | Used in API docs page |
| `NEXT_PUBLIC_ML_API_BASE_URL` | No | Used in ML API docs page |

### Website (`fyp-website/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_AUTH_API_URL` | Yes | Patient backend URL (e.g. `http://localhost:5000/api`) |
| `NEXT_PUBLIC_PATIENT_APP_URL` | Yes | Patient portal URL |
| `NEXT_PUBLIC_DOCTOR_APP_URL` | Yes | Doctor portal URL |
| `NEXT_PUBLIC_ADMIN_APP_URL` | No | Admin portal URL |
| `NEXT_PUBLIC_ROOT_URL` | No | Website's own URL |
| `NEXT_PUBLIC_APP_URL` | No | Website URL for CTA links |

## Key Features

- **AI Chat** — n8n-powered medical assistant with symptom analysis and doctor recommendations
- **Voice Calls** — Retell browser-based voice agent for booking appointments hands-free
- **Appointment Booking** — real-time slot availability with Google Calendar sync and timezone-aware conflict detection
- **Disease Prediction** — CatBoost ML model predicts diseases from a list of symptoms
- **Doctor Verification** — admins approve doctors with document review
- **Patient Privacy Controls** — patients can toggle AI data sharing, doctor chat access, and delete chat history
- **Rate Limiting** — all backends protected with `express-rate-limit` and `helmet`
- **PHI Redaction** — sensitive fields are stripped from API logs in production
- **API Tokens** — hashed SHA-256 tokens for external calling agent integration

## Deployment

All services are deployed on **Railway**. The shared PostgreSQL database is a Railway-managed Postgres instance. The ML service can be deployed standalone on Railway, Hugging Face Spaces (Docker), or any Python host — see `fyp-admin/backend/ml-service/DEPLOYMENT.md`.

## Project Structure

```
fyp-project/
├── fyp-patient/
│   ├── backend/          # Express + Prisma patient API
│   └── frontend/         # Next.js patient portal
├── fyp-doctor/
│   ├── backend/          # Express + Prisma doctor API
│   └── frontend/         # Next.js doctor dashboard
├── fyp-admin/
│   ├── backend/
│   │   ├── src/          # Express + Prisma admin API
│   │   └── ml-service/   # Python FastAPI + CatBoost
│   └── frontend/         # Next.js admin panel
└── fyp-website/          # Next.js marketing + guest chat
```

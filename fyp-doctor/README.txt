DOCLINK — DOCTOR PORTAL
=======================

Doctor dashboard frontend and backend for the DocLink healthcare platform.
Doctors manage appointments, patients, availability, and Google Calendar integration.

PROJECT STRUCTURE
=================

fyp-doctor/
├── frontend/                   Next.js doctor dashboard (port 3001)
│   ├── src/app/(dashboard)/   Dashboard pages
│   │   ├── dashboard/         Overview and stats
│   │   ├── appointments/      Appointment management
│   │   ├── patients/          Patient records and chat history
│   │   ├── calls/             Voice agent call logs
│   │   ├── availability/      Slot-by-slot schedule management
│   │   ├── profile/           Doctor profile editing
│   │   └── settings/          Password, notification prefs, privacy
│   └── src/components/        Reusable UI components
│
├── backend/                    Express + Prisma API (port 5001)
│   ├── src/controllers/       Route handlers
│   ├── src/routes/            Express routers
│   ├── src/lib/               Google Calendar, R2, JWT utilities
│   ├── src/middleware/        JWT auth middleware
│   └── prisma/                Schema and seed
│
└── README.txt                  This file


QUICK START
===========

1. Backend setup (cd fyp-doctor/backend):

   pnpm install
   # Create .env — see ENVIRONMENT VARIABLES below
   npx prisma generate
   pnpm dev

   Backend runs on: http://localhost:5001

2. Frontend setup (cd fyp-doctor/frontend, new terminal):

   pnpm install
   # Create .env.local — see ENVIRONMENT VARIABLES below
   pnpm dev

   Frontend runs on: http://localhost:3001

3. Demo login:
   Email:    doctor@example.com
   Password: doctor123
   (requires seed data: pnpm db:seed from fyp-patient/backend)


ENVIRONMENT VARIABLES
=====================

Backend (.env):

  DATABASE_URL              PostgreSQL connection string (shared DB)
  JWT_SECRET                Secret for signing JWTs (required; must not be default in production)
  JWT_EXPIRES_IN            Token lifetime (default: 7d)
  GOOGLE_CLIENT_ID          Google OAuth client ID
  GOOGLE_CLIENT_SECRET      Google OAuth client secret
  GOOGLE_OAUTH_REDIRECT_URI Redirect URI registered in Google Cloud Console
  GOOGLE_TOKEN_ENC_KEY      32-char key for AES-256-GCM encryption of Google refresh tokens
  VAPI_WEBHOOK_SECRET       Shared secret for VAPI webhook verification (required in production)
  RETELL_WEBHOOK_SECRET     Shared secret for Retell webhook verification (required in production)
  S3_ENDPOINT               Cloudflare R2 endpoint URL
  S3_ACCESS_KEY_ID          R2 access key
  S3_SECRET_ACCESS_KEY      R2 secret key
  S3_BUCKET_NAME            R2 bucket for verification documents
  S3_REGION                 R2 region (default: auto)
  APPOINTMENT_TIMEZONE      Timezone for availability calculations (default: Asia/Karachi)
  FRONTEND_URL              Doctor frontend URL for CORS (default: http://localhost:3001)
  PORT                      Server port (default: 5001)
  NODE_ENV                  Set to production to enforce strict secrets

Frontend (.env.local):

  NEXT_PUBLIC_API_URL       Doctor backend URL (default: http://localhost:5001/api)
  NEXT_PUBLIC_WEBSITE_URL   Website URL for redirects and branding links


API ENDPOINTS
=============

Public:
  GET  /api/health
  POST /api/auth/login
  POST /api/auth/signup         (starts onboarding wizard)
  POST /api/auth/documents/presign
  GET  /api/auth/specialties
  GET  /api/doctor/google/callback

Authenticated (JWT):
  GET  /api/auth/me
  GET  /api/doctor/google/connect
  GET  /api/doctor/google/status
  POST /api/doctor/google/disconnect

  Dashboard:
    GET  /api/doctor/dashboard/stats
    GET  /api/doctor/dashboard/appointments/today
    GET  /api/doctor/dashboard/calls/recent

  Appointments:
    GET   /api/doctor/appointments
    GET   /api/doctor/appointments/:id
    PUT   /api/doctor/appointments/:id

  Patients:
    GET   /api/doctor/patients
    GET   /api/doctor/patients/:id
    GET   /api/doctor/patients/:id/symptoms
    GET   /api/doctor/patients/:id/predictions
    GET   /api/doctor/patients/:id/chat-history   (respects patient privacy flag)
    GET   /api/doctor/patients/:id/appointments

  Calls:
    GET   /api/doctor/calls             (enriched with patient name)
    GET   /api/doctor/calls/:id

  Availability:
    GET   /api/doctor/availability
    PUT   /api/doctor/availability

  Profile:
    GET   /api/doctor/profile
    PUT   /api/doctor/profile
    GET   /api/doctor/reviews

  Settings:
    PUT   /api/doctor/settings/password
    GET   /api/doctor/settings/notifications
    PUT   /api/doctor/settings/notifications

Webhooks (public, rate-limited):
  POST  /api/webhooks/vapi     VAPI voice agent webhook (call ended)
  POST  /api/webhooks/retell   Retell voice agent webhook (call_ended event)


FEATURES
========

Dashboard
  - Summary stats: total patients, confirmed appointments, call count, avg rating
  - Today's appointments and recent call log at a glance

Appointments
  - View, confirm, and manage appointment status
  - Google Calendar sync — new bookings mirrored as calendar events

Patient Records
  - Patient list with search
  - Per-patient: profile, symptom history, AI disease predictions, appointment history
  - Chat history access (respects patient's allowDoctorChatAccess privacy flag)

Call Logs
  - Full call log from VAPI and Retell voice agents
  - Caller name enriched from linked Patient record if not stored at call time

Availability Management
  - Set working days and available hours
  - Override individual dates with custom slot lists (like Calendly)
  - Past slots and slots too close to now are automatically blocked (minAdvanceSlots)
  - Google Calendar busy times block slots in real time

Google Calendar Integration
  - Connect via OAuth — requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - Google busy times are reflected in the availability picker
  - Appointments booked via any channel are optionally synced to Google Calendar
  - Refresh token is stored AES-256-GCM encrypted (GOOGLE_TOKEN_ENC_KEY)

Profile
  - Edit personal info, qualifications, consultation fee, city
  - Upload verification documents to Cloudflare R2

Settings
  - Change password
  - Toggle email / SMS notification preferences (persisted to DB)
  - Privacy page: data retention info, patient access controls, notification settings

Security
  - Rate limiting: /api/auth/* → 30 req / 15 min; /api/webhooks/* → 60 req / 1 min
  - Helmet security headers on all responses
  - JWT required in production; server exits at startup if secret is default
  - Webhook secrets enforced in production for VAPI and Retell
  - Google refresh tokens AES-256-GCM encrypted at rest
  - Next.js middleware: unauthenticated dashboard requests redirect to login


TECH STACK
==========

Frontend:
  Next.js 16, React 19, TypeScript
  Tailwind CSS v4, shadcn/ui, Framer Motion
  Axios, Sonner

Backend:
  Express 4, TypeScript, Prisma 6, PostgreSQL
  JWT, bcryptjs, Zod 4
  AWS SDK v3 (Cloudflare R2), Multer
  Google APIs (Calendar), Helmet, express-rate-limit

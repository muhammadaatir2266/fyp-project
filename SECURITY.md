# DocLink — Security & Privacy Implementation

> This document describes every security and privacy measure implemented in the DocLink platform.
> Last updated: June 2026

---

## Table of Contents
1. [Authentication & Authorization](#1-authentication--authorization)
2. [API Security](#2-api-security)
3. [Data Protection](#3-data-protection)
4. [Patient Privacy Controls](#4-patient-privacy-controls)
5. [Doctor Privacy Controls](#5-doctor-privacy-controls)
6. [Production Hardening Checklist](#6-production-hardening-checklist)
7. [Required Environment Variables](#7-required-environment-variables)
8. [Retell Agent — No Changes Needed](#8-retell-agent--no-changes-needed)
9. [Database Migrations to Apply](#9-database-migrations-to-apply)

---

## 1. Authentication & Authorization

| Measure | Location | Detail |
|---|---|---|
| JWT Bearer auth | All 3 backends | 7-day expiry; `JWT_SECRET` validated at startup — crashes in production if unset or default |
| DB role re-check | doctor & admin middleware | Doctor/admin status re-verified from DB on every request |
| Resource scoping | appointments, patient controllers | Records are always filtered by `patientId` / `doctorId` |
| `requireRole('PATIENT')` | patient routes | Added to appointments, profile, symptoms, review-submission routes |
| bcrypt (cost 10) | Auth controllers | Passwords hashed at rest |
| Google OAuth state JWT | doctor google controller | Short-lived signed state prevents CSRF |
| Google refresh token encryption | `google-calendar.ts` | AES-256-GCM before DB storage |
| API token lifecycle | admin `apiToken.ts` | Active flag, expiry, usage count, per-token revoke |

### What was hardened
- **JWT fallback removed in production**: all three `lib/jwt.ts` files call `process.exit(1)` at startup if `JWT_SECRET` is missing or still set to the default value `your-secret-key-change-in-production`.
- **Seed script guard**: all `prisma/seed.ts` / `seed.js` files abort immediately with an error if `NODE_ENV=production`.

---

## 2. API Security

### Rate limiting (added to all backends)

| Backend | Route | Limit |
|---|---|---|
| Patient | `/api/auth/*` | 30 req / 15 min |
| Patient | `/api/chat/*` | 20 req / 1 min |
| Doctor | `/api/auth/*` | 30 req / 15 min |
| Doctor | `/api/webhooks/*` | 60 req / 1 min |
| Admin | `/api/auth/*` | 30 req / 15 min |
| Admin | `/api/v1/*` (Retell API) | 120 req / 1 min |

### Security headers (Helmet)
- **Patient backend**: already had Helmet.
- **Doctor backend**: Helmet added — sets `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.
- **Admin backend**: Helmet added.

### Webhook authentication
- Retell and VAPI webhooks now **fail with 500** in `NODE_ENV=production` if their secret env vars are not set (instead of silently skipping auth in development).
- In development with secrets set, signatures are still verified.

### API token hashing (admin `/api/v1`)
- New tokens are stored as SHA-256(`token`) in a new `tokenHash` column.
- The middleware looks up by `tokenHash` first (constant-time), falls back to plaintext for legacy tokens.
- The raw token is returned **only once** at creation time and is never retrievable again.
- Run `prisma/migrations/20260628_add_api_token_hash/migration.sql` to add the column.

---

## 3. Data Protection

### PHI redaction in logs
- `apiLogger.ts` (admin backend) now redacts the following fields from logged request bodies before writing to `ApiLog`:
  `patientPhone`, `patientEmail`, `patientName`, `phone`, `email`, `medicalHistory`, `allergies`, `dateOfBirth`, `reason`, `password`
- **Response bodies are never stored** in `ApiLog` (previously stored up to 5,000 chars).

### n8n debug logging removed
- Both `console.log('[n8n raw response]', ...)` debug lines in `chat.controller.ts` have been removed — full patient PHI payloads were previously printed to server stdout on every chat message.

### Voice-created patient accounts
- Auto-created patient accounts (PSTN calls) now receive a **cryptographically random 32-byte hex password** (`crypto.randomBytes(32).toString('hex')`).
- The old hardcoded `temp123` password has been eliminated.
- Patients claim their account via "Forgot Password".

### Automatic data retention (cron)
A `retentionCron.ts` runs once at startup then every hour and purges:

| Table | TTL |
|---|---|
| `GuestChatSnapshot` | `expiresAt` (24 h) |
| `CallBookingIntent` | `expiresAt` (30 min) |
| `ApiLog` | 90 days from `createdAt` |

---

## 4. Patient Privacy Controls

### New Privacy Settings page (`/patient/settings/privacy`)
Accessible from the dashboard sidebar under **Privacy**.

| Toggle | What it controls |
|---|---|
| **Share health data with AI Assistant** | When OFF: `medicalHistory`, `allergies`, `dateOfBirth`, `gender` are stripped from the n8n chat payload. Only name and city are sent. |
| **Allow doctors to view chat history & AI predictions** | When OFF: `GET /api/doctor/patient/:id/chat` returns an empty array. Doctors see no AI predictions. |

### Chat session deletion
- A **Delete All Chat Sessions** button (with confirmation step) calls `DELETE /api/profile/chat-sessions`, which hard-deletes all `ChatSession` rows for the patient.

### How preferences are stored
Two new boolean columns on the `Patient` table (both default `true`):
- `shareDataWithAI`
- `allowDoctorChatAccess`

Applied via: `prisma/migrations/20260628_add_patient_privacy_prefs/migration.sql`

---

## 5. Doctor Privacy Controls

### Notification settings now persisted
- Previously `PUT /api/doctor/settings/notifications` was a no-op (returned success but wrote nothing to DB).
- Now persists `emailNotifications` and `smsNotifications` to the `Doctor` row.
- New `GET /api/doctor/settings/notifications` loads current values on the settings page mount.

Applied via: `prisma/migrations/20260628_add_doctor_notification_prefs/migration.sql`

### Appointment gate for patient PHI
- Doctor access to patient chat history is already gated by a shared appointment check.
- **Now also respects `allowDoctorChatAccess`**: if the patient has opted out, an empty array is returned.

---

## 6. Production Hardening Checklist

Before deploying to production, ensure all of the following are set in each backend's environment:

### All backends
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` — strong random string (min 32 chars). **Must be the same value** on all three backends so tokens are cross-verifiable.
- [ ] `DATABASE_URL` — pointing to production PostgreSQL

### Doctor backend
- [ ] `RETELL_WEBHOOK_SECRET` — copied from **Retell dashboard → Agent → Webhook → Signing Secret**
- [ ] `VAPI_WEBHOOK_SECRET` — if using VAPI webhooks
- [ ] `GOOGLE_TOKEN_ENC_KEY` — random 32+ char string used to encrypt stored Google refresh tokens

### Admin backend
- [ ] `GOOGLE_TOKEN_ENC_KEY` — must match doctor backend value

### Patient backend
- [ ] `RETELL_API_KEY` — from Retell dashboard → API Keys
- [ ] `RETELL_AGENT_ID` — from Retell dashboard → Agents

---

## 7. Required Environment Variables

Full reference for each service:

### `fyp-patient/backend`
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<strong_random_32+_chars>        # REQUIRED in production
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-patient-app.com
WEBSITE_URL=https://your-website.com
N8N_CHAT_WEBHOOK_URL=https://...
RETELL_API_KEY=key_...                       # from Retell dashboard
RETELL_AGENT_ID=agent_...                    # from Retell dashboard
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_TOKEN_ENC_KEY=<random_32+_chars>
GOOGLE_MAPS_API_KEY=...
```

### `fyp-doctor/backend`
```env
NODE_ENV=production
PORT=5001
JWT_SECRET=<same_value_as_patient_backend>   # REQUIRED — must match patient backend
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-doctor-app.com
RETELL_WEBHOOK_SECRET=<from_retell_dashboard> # REQUIRED in production
VAPI_WEBHOOK_SECRET=<from_vapi_dashboard>    # if using VAPI
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://your-doctor-backend.com/api/doctor/google/callback
GOOGLE_OAUTH_SUCCESS_REDIRECT=https://your-doctor-app.com/availability
GOOGLE_TOKEN_ENC_KEY=<same_value_as_admin_backend>
```

### `fyp-admin/backend`
```env
NODE_ENV=production
PORT=5002
JWT_SECRET=<same_value_as_patient_backend>   # REQUIRED — must match
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-admin-app.com
VAPI_WEBHOOK_SECRET=<from_vapi_dashboard>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_TOKEN_ENC_KEY=<same_value_as_doctor_backend>
```

> **Tip — generate strong secrets:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Run this three times to get distinct values for `JWT_SECRET` (shared), `GOOGLE_TOKEN_ENC_KEY` (shared across doctor + admin), and any additional secrets.

---

## 8. Retell Agent — No Changes Needed

**Your Retell agent integration does not need to be updated.**

Here is why each part is unaffected:

| Component | Status |
|---|---|
| `RETELL_API_KEY` / `RETELL_AGENT_ID` | Unchanged — same env vars, same values |
| `retell_llm_dynamic_variables` payload | Unchanged — `patient_id`, `patient_name`, `patient_phone`, `patient_email`, `doctor_*`, `current_date`, etc. all still sent |
| Admin `/api/v1` token used by Retell | **No change needed** — existing tokens still work via plaintext fallback. Only *new* tokens created after migration use the hash flow. |
| Webhook endpoint URLs | Unchanged |
| `RETELL_WEBHOOK_SECRET` | Already present in your `.env` — just make sure it is set in production (the server now **requires** it in `NODE_ENV=production`) |

**One thing to verify:** confirm `RETELL_WEBHOOK_SECRET` in your doctor backend `.env` matches the **Signing Secret** shown in the Retell dashboard under your agent's webhook settings. If it was already there and working before, you don't need to change anything.

---

## 9. Database Migrations to Apply

Three migration SQL files were created. Apply them when your Railway database is reachable:

```bash
cd fyp-patient/backend
pnpm prisma migrate deploy
```

Or apply the SQL manually:

```sql
-- 1. Patient privacy preferences
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "shareDataWithAI" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "allowDoctorChatAccess" BOOLEAN NOT NULL DEFAULT true;

-- 2. Doctor notification preferences
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "smsNotifications" BOOLEAN NOT NULL DEFAULT false;

-- 3. API token hashing
ALTER TABLE "ApiToken" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT UNIQUE;
```

All columns have safe defaults — no existing data is affected.

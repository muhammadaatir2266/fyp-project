# DocLink Admin Portal — Setup & Services Guide

The admin portal consists of three services: a Node.js backend API, a Python ML service, and a Next.js frontend.

## Prerequisites

- Node.js 18+
- pnpm (`npm i -g pnpm`)
- Python 3.8+
- PostgreSQL database (shared with patient and doctor backends)

## Installation

### Node.js Backend
```bash
cd fyp-admin/backend
pnpm install
```

### ML Service
```bash
cd fyp-admin/backend/ml-service
pip install -r requirements.txt
```

### Frontend
```bash
cd fyp-admin/frontend
pnpm install
```

## Environment Variables

### Backend (`fyp-admin/backend/.env`)

```env
DATABASE_URL="postgresql://user:password@host:5432/doclink"
JWT_SECRET="a-long-random-secret-min-32-chars"
ML_SERVICE_URL="http://127.0.0.1:5001"
FRONTEND_URL="http://localhost:3002"
APPOINTMENT_TIMEZONE="Asia/Karachi"

# Cloudflare R2 (for verification document access)
S3_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="doclink"

# Optional Google Calendar (for calendar event management)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Frontend (`fyp-admin/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_WEBSITE_URL="http://localhost:3003"
NEXT_PUBLIC_DOCTOR_API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_ML_API_BASE_URL="http://localhost:4000"
```

## Starting Services

Open one terminal per service:

### Terminal 1 — Node.js Backend (port 4000)
```bash
cd fyp-admin/backend
pnpm dev
```

### Terminal 2 — ML Service (port 5001)
```bash
cd fyp-admin/backend/ml-service
python app.py
```

### Terminal 3 — Frontend (port 3002)
```bash
cd fyp-admin/frontend
pnpm dev
```

## Verification

| Check | URL |
|-------|-----|
| Backend health | http://localhost:4000/health |
| ML health (via backend) | http://localhost:4000/api/v1/ml/health *(requires API token)* |
| Frontend | http://localhost:3002 |

## Demo Login

```
Email:    admin@doclink.com
Password: admin123
```

*(Requires seed data — run `pnpm db:seed` from `fyp-patient/backend` once.)*

---

## Admin Panel Features

### Doctor Verification
- Review submitted verification documents
- Approve or reject doctor registrations
- Toggle doctor active/inactive status

### Appointment Management
- View, update, or cancel any appointment across the platform

### Specialties
- Add, edit, and manage medical specialties and their aliases

### API Access
- Generate hashed API tokens for external integrations (tokens are shown **once** at creation)
- View per-token request statistics
- Delete tokens

### API Logs
- View recent API request logs (PHI fields are redacted)

### Settings
- Update admin profile and change password

---

## Calling Agent REST API (`/api/v1/*`)

The admin backend exposes a REST API for voice agents (Retell) to check availability, book, and manage appointments.

**Authentication:** `Authorization: Bearer <api-token>`

All tokens are stored as SHA-256 hashes. The plaintext token is only returned once at creation time from the Admin UI (`/api-access`).

**Rate limit:** 120 requests per minute per token.

### Doctors

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/doctors` | List active, approved doctors |
| GET | `/api/v1/doctors/:doctorId/availability?date=YYYY-MM-DD&time=HH:MM` | Check if a specific slot is available |
| GET | `/api/v1/doctors/:doctorId/slots?date=YYYY-MM-DD` | List all available slots for a date |

### Appointments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/doctors/:doctorId/appointments` | Book an appointment |
| GET | `/api/v1/appointments?patientId=&patientPhone=` | List patient appointments |
| PATCH | `/api/v1/appointments/:appointmentId/cancel` | Cancel an appointment |

**Book appointment request body:**
```json
{
  "patientId": "uuid",
  "intentId": "uuid",
  "patientName": "Ali Khan",
  "patientPhone": "+923001234567",
  "patientEmail": "ali@example.com",
  "date": "2025-03-15",
  "time": "14:30",
  "reason": "Fever and cough",
  "duration": 30
}
```

Provide at least one patient identifier (`patientId`, `intentId`, or `patientName + patientPhone`).
The endpoint validates that the slot is in the future, within the doctor's working hours, and not already booked.

### Specialties & Cities

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/specialties` | All medical specialties with aliases |
| GET | `/api/v1/cities` | Distinct cities of active doctors |

### ML / Disease Prediction

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ml/predict` | Predict disease from symptoms |
| GET | `/api/v1/ml/symptoms` | All symptoms the model recognises |
| GET | `/api/v1/ml/diseases` | All diseases the model can predict |
| GET | `/api/v1/ml/health` | ML service health check |

**Predict request body:**
```json
{ "symptoms": ["fever", "cough", "headache"] }
```

**Predict response:**
```json
{
  "predicted_disease": "Flu",
  "confidence": 0.87,
  "top_3_predictions": [
    { "disease": "Flu", "confidence": 0.87 },
    { "disease": "Common Cold", "confidence": 0.09 }
  ]
}
```

---

## Troubleshooting

### ML Service Not Responding
- Ensure `python app.py` is running in `fyp-admin/backend/ml-service`
- Verify `ML_SERVICE_URL` in `fyp-admin/backend/.env` matches the Python service URL
- Check that `models/catboost_disease_model.cbm` and `models/label_encoder.pkl` exist

### API Token Returns 401
- Tokens are single-use display — copy them immediately after creation
- Ensure the `Authorization: Bearer <token>` header is sent with the full plaintext token

### Database Not Found
- The shared PostgreSQL database is migrated from `fyp-patient/backend`
- Run `pnpm db:migrate` from `fyp-patient/backend` before starting any backend

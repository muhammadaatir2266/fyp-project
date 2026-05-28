# Trimed Al — AI-Powered Virtual Medical Assistant

Multi-portal healthcare platform with patient AI chat, disease prediction, doctor recommendations, and a voice calling agent for doctor-side call automation.

## Architecture

```
fyp-patient/   — Patient portal (FE: 3000, API: 5000)
fyp-doctor/    — Doctor portal  (FE: 3001, API: 5001)
fyp-admin/     — Admin portal   (FE: 3002, API: 4000, ML: 8000)
fyp-website/   — Marketing site (FE: 3003)
```

All portals share **one PostgreSQL database**. Migrations are managed from `fyp-patient/backend/`.

## Quick Start

### 1. Database

Create a PostgreSQL database and note the connection string.

### 2. Environment files

Copy `fyp-patient/backend/env.example` to `fyp-patient/backend/.env` and fill in:

```
DATABASE_URL="postgresql://user:password@localhost:5432/trimed_al"
JWT_SECRET=<random-secret>
N8N_CHAT_WEBHOOK_URL=<your-n8n-webhook>
ML_MODEL_API_URL=http://localhost:8000
```

Do the same for `fyp-doctor/backend/.env` (PORT=5001) and `fyp-admin/backend/.env` (PORT=4000).

### 3. Migrate & Seed

```bash
cd fyp-patient/backend
npx prisma migrate deploy   # applies all migrations
npx prisma db seed          # seeds demo users & specialties
```

### 4. Start all services

```bash
# Terminal 1 — Patient API
cd fyp-patient/backend && pnpm dev

# Terminal 2 — Patient Frontend
cd fyp-patient/frontend && pnpm dev          # http://localhost:3000

# Terminal 3 — Doctor API
cd fyp-doctor/backend && pnpm dev

# Terminal 4 — Doctor Frontend
cd fyp-doctor/frontend && pnpm dev           # http://localhost:3001

# Terminal 5 — Admin API
cd fyp-admin/backend && pnpm dev

# Terminal 6 — Admin Frontend
cd fyp-admin/frontend && pnpm dev            # http://localhost:3002

# Terminal 7 — Marketing Website
cd fyp-website && pnpm dev                   # http://localhost:3003

# Terminal 8 — ML Service (Python)
cd fyp-admin/backend/ml-service/disease-prediction-api && python app.py
```

## Demo Credentials

| Role    | Email                      | Password   |
|---------|----------------------------|------------|
| Patient | patient@mediassist.com     | patient123 |
| Doctor  | doctor@mediassist.com      | doctor123  |
| Admin   | admin@mediassist.com       | admin123   |

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Framer Motion
- **Backend:** Express.js (TypeScript for patient, JavaScript for doctor/admin)
- **Database:** PostgreSQL via Prisma ORM
- **AI/Automation:** OpenAI API, n8n workflow automation
- **Voice Agent:** VAPI / Retell for doctor-side call handling
- **ML:** Python Flask, scikit-learn (Kaggle Disease Symptom Prediction dataset)

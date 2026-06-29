# DocLink — Marketing Website

Public-facing marketing website for the DocLink healthcare platform. Includes guest AI chat, patient/doctor sign-up flows, and links to all portals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| HTTP | Axios |
| Markdown | react-markdown |

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- Patient backend running on port 5000

### Installation

```bash
cd fyp-website
pnpm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:5000/api
NEXT_PUBLIC_PATIENT_APP_URL=http://localhost:3000
NEXT_PUBLIC_DOCTOR_APP_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3002
NEXT_PUBLIC_ROOT_URL=http://localhost:3003
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### Development

```bash
pnpm dev   # http://localhost:3003
```

### Production build

```bash
pnpm build
pnpm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_AUTH_API_URL` | Yes | `http://localhost:5000/api` | Patient backend API URL |
| `NEXT_PUBLIC_PATIENT_APP_URL` | Yes | `http://localhost:3000` | Patient portal URL (CTA links) |
| `NEXT_PUBLIC_DOCTOR_APP_URL` | Yes | `http://localhost:3001` | Doctor portal URL (sign-up links) |
| `NEXT_PUBLIC_ADMIN_APP_URL` | No | `http://localhost:3002` | Admin portal URL |
| `NEXT_PUBLIC_ROOT_URL` | No | `/` | This website's own URL |
| `NEXT_PUBLIC_APP_URL` | No | — | Used by CTA buttons across marketing pages |

## Pages and Routes

### Marketing Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — platform overview and key features |
| `/about` | About DocLink |
| `/features` | Feature breakdown for patients and doctors |
| `/pricing` | Pricing tiers |
| `/faq` | Frequently asked questions |
| `/contact` | Contact form |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

### Auth & Sign-up

| Route | Description |
|-------|-------------|
| `/login` | Shared login — redirects patients to `:3000`, doctors to `:3001`, admins to `:3002` |
| `/signup` | Sign-up role selector |
| `/signup/patient` | Patient registration wizard |
| `/signup/doctor` | Redirects to the doctor portal sign-up at `:3001/signup` |

### Guest AI Chat

| Route | Description |
|-------|-------------|
| `/chat` | AI symptom chat for unauthenticated users |

## Guest Chat Flow

Unauthenticated users can interact with the AI assistant without creating an account:

```
Guest opens /chat
    │
    ▼
POST /api/chat/guest/message   (no auth required)
    │  backend assigns a guestSessionId cookie
    ▼
Conversation continues (messages stored in GuestChatSnapshot)
    │
    ├─ Guest closes tab → snapshot auto-expires after 24 hours
    │
    └─ Guest signs up or logs in
           │
           ▼
       POST /api/chat/guest/claim   (JWT required)
           │  transfers snapshot to authenticated ChatSession
           ▼
       Conversation continues in patient portal
```

## Authentication Redirect Logic

The `/login` page calls `GET /api/auth/me` with the stored JWT and redirects based on role:

| Role | Redirect |
|------|---------|
| `PATIENT` | `NEXT_PUBLIC_PATIENT_APP_URL/patient/dashboard` |
| `DOCTOR` | `NEXT_PUBLIC_DOCTOR_APP_URL/dashboard` |
| `ADMIN` | `NEXT_PUBLIC_ADMIN_APP_URL/dashboard` |

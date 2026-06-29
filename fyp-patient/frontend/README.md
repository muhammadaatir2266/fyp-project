# DocLink — Patient Frontend

Next.js 16 patient portal for the DocLink healthcare platform. Patients can search doctors, book appointments, chat with an AI assistant, and start browser-based voice calls.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| HTTP | Axios |
| Voice | Retell client SDK |
| Notifications | Sonner |

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- Patient backend running on port 5000

### Installation

```bash
cd fyp-patient/frontend
pnpm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3003
NEXT_PUBLIC_RETELL_API_KEY=key_...
```

### Development

```bash
pnpm dev   # http://localhost:3000
```

### Production build

```bash
pnpm build
pnpm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:5000/api` | Patient backend base URL |
| `NEXT_PUBLIC_WEBSITE_URL` | Yes | `http://localhost:3003` | Website URL for redirects and logout |
| `NEXT_PUBLIC_RETELL_API_KEY` | Yes | — | Retell public key for browser voice SDK |

## Pages and Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login page (redirects to website login) |
| `/signup` | Public | Registration page |
| `/auth/callback` | Public | OAuth / Google auth callback |
| `/patient/dashboard` | Patient | Overview — upcoming appointments, quick actions |
| `/patient/doctors` | Patient | Doctor search with filters (specialty, city, rating) |
| `/patient/doctors/[id]` | Patient | Doctor profile with reviews and booking |
| `/patient/appointments` | Patient | Appointment list with cancel / reschedule |
| `/patient/profile` | Patient | Edit personal info and medical history |
| `/patient/settings` | Patient | Account settings (password) |
| `/patient/settings/privacy` | Patient | Privacy controls and chat deletion |

All routes under `/patient/*` are protected by Next.js middleware — unauthenticated users are redirected to the website login page.

## Authentication

- JWT is stored in `localStorage` after login
- A session cookie (`authToken` + `userRole`) is set for Next.js middleware route protection
- On logout, both `localStorage` and the cookies are cleared
- The middleware redirects unauthenticated requests for `/patient/*` to the website's `/login` page

## AI Chat Widget

A floating chat widget is available on all patient dashboard pages. It sends messages to the n8n AI assistant via the patient backend and displays doctor recommendations inline. Guest sessions (from the public website) can be claimed after login to preserve conversation history.

## Voice Call Feature

Patients can start a browser-based voice call with the Retell AI agent from the doctor booking page. The call allows the patient to book, reschedule, or cancel appointments hands-free. The `NEXT_PUBLIC_RETELL_API_KEY` is required to initialise the Retell browser SDK.

## Privacy Settings (`/patient/settings/privacy`)

| Setting | Description |
|---------|-------------|
| Share data with AI | When off, PHI is stripped before forwarding chat to n8n |
| Allow doctor chat access | When off, doctors cannot view the patient's chat history |
| Delete all chat sessions | Permanently deletes all chat sessions and messages |

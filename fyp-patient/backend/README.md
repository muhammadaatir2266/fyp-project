# MedAssistant Backend

Backend API server for the AI Medical Assistant application with JWT-based authentication and n8n webhook integration.

## Features

- 🔐 JWT-based authentication
- 👥 User management (Patients, Doctors, Admins)
- 💬 Chat integration with n8n webhook
- 🗄️ PostgreSQL database with Prisma ORM
- 🛡️ Security with Helmet and CORS
- ✅ Input validation with Zod

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **HTTP Client**: Axios

## Setup

### Prerequisites

- Node.js 18+ or 20+
- PostgreSQL database
- pnpm (or npm/yarn)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env` file from example:

```bash
cp env.example .env
```

3. Update `.env` with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/medical_assistant?schema=public"
JWT_SECRET=your_super_secret_jwt_key_here
N8N_CHAT_WEBHOOK_URL=https://fyp2026.app.n8n.cloud/webhook/55479a0c-6a9f-4083-ad95-8cbe28d9e828
```

4. Generate Prisma client and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

5. (Optional) Seed the database:

```bash
pnpm db:seed
```

### Development

Start the development server:

```bash
pnpm dev
```

Server will run on `http://localhost:5000`

### Production

Build and start:

```bash
pnpm build
pnpm start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signup/doctor` - Complete doctor registration (protected)
- `GET /api/auth/me` - Get current user (protected)

### Chat

- `POST /api/chat/message` - Send message to n8n webhook (protected, patient only)

## Authentication Flow

1. User signs up or logs in
2. Backend validates credentials and generates JWT token
3. Frontend stores token in localStorage
4. Frontend includes token in `Authorization: Bearer <token>` header
5. Backend middleware verifies token on protected routes

## Chat Integration

The chat endpoint:
1. Receives message from authenticated patient
2. Extracts patient_id from JWT token
3. Calls n8n webhook with patient_id, message, and user_info
4. Returns webhook response to frontend

### Webhook Payload Format

```json
{
  "patient_id": "uuid",
  "message": "user message",
  "user_info": {
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "MALE",
    "medicalHistory": "...",
    "allergies": "..."
  },
  "location": "City Name",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:3000) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | No (default: 7d) |
| `N8N_CHAT_WEBHOOK_URL` | n8n webhook URL for chat | Yes |

## Database Schema

Key models:
- `User` - Authentication and role management
- `Patient` - Patient profile and medical info
- `Doctor` - Doctor profile and availability
- `ChatSession` - Chat conversation tracking
- `ChatMessage` - Individual chat messages
- `Appointment` - Appointment bookings
- `Specialty` - Medical specialties
- `Disease` - Disease information
- `Symptom` - Symptom catalog

## Security

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens for stateless authentication
- CORS enabled for frontend origin only
- Helmet.js for security headers
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message"
}
```

## Development Notes

- Use `pnpm dev` for hot-reload during development
- Prisma Studio: `npx prisma studio` to view/edit database
- Database migrations: `pnpm db:migrate`
- Generate Prisma client: `pnpm db:generate`

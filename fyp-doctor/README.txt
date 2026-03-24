DOCTOR DASHBOARD - PROJECT STRUCTURE
=====================================

This project contains both frontend and backend for the Doctor Dashboard application.

PROJECT STRUCTURE:
==================

fyp-doctor/
├── frontend/              # Next.js Frontend Application
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript types
│   ├── package.json
│   ├── .env.local        # Frontend environment config
│   └── ...config files
│
├── backend/              # Express.js Backend API
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth middleware
│   │   ├── routes/       # API routes
│   │   └── config/       # Database config
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── seed.js       # Sample data
│   ├── package.json
│   ├── .env              # Backend environment config
│   └── BACKEND_SETUP.txt
│
└── README.txt            # This file

QUICK START:
============

1. Setup Backend:
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   npm run dev

2. Setup Frontend (in new terminal):
   cd frontend
   npm install
   npm run dev

3. Access Application:
   Frontend: http://localhost:3001
   Backend API: http://localhost:5000

LOGIN CREDENTIALS:
==================
Email: doctor@example.com
Password: doctor123

PORTS:
======
Frontend: 3001
Backend: 5000

DOCUMENTATION:
==============
- Frontend Setup: See frontend/SETUP.txt
- Backend Setup: See backend/BACKEND_SETUP.txt
- Quick Start: See QUICKSTART.txt

TECH STACK:
===========
Frontend:
- Next.js 16
- TypeScript
- Tailwind CSS v4
- Shadcn UI
- Axios

Backend:
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcryptjs

FEATURES:
=========
✅ Dashboard with statistics
✅ Appointments management
✅ Patient records with AI predictions
✅ Call logs from voice agent
✅ Availability management
✅ Profile management
✅ Settings (password, notifications)

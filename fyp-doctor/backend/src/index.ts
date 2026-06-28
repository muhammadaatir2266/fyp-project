import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.routes'
import doctorRoutes from './routes/doctor.routes'
import googleRoutes from './routes/google.routes'
import webhookRoutes from './routes/webhook.routes'

const app = express()
const PORT = process.env.PORT || 5001

app.set('trust proxy', 1) // Railway / any reverse proxy — required for rate-limit IP detection
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })
const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false })

app.use('/api/auth', authLimiter, authRoutes)
// Mounted before /api/doctor so the public Google OAuth callback bypasses the
// global doctor auth middleware.
app.use('/api/doctor/google', googleRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/webhooks', webhookLimiter, webhookRoutes)

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Doctor Dashboard API is running' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Doctor Dashboard API running on port ${PORT}`)
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

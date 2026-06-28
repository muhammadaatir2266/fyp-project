import 'dotenv/config'
import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { connectDatabase } from './config/database'
import { errorHandler, notFound } from './middleware/error.middleware'
import authRoutes from './routes/auth.routes'
import chatRoutes from './routes/chat.routes'
import doctorsRoutes from './routes/doctors.routes'
import appointmentsRoutes from './routes/appointments.routes'
import profileRoutes from './routes/profile.routes'
import symptomsRoutes from './routes/symptoms.routes'
import reviewsRoutes from './routes/reviews.routes'
import configRoutes from './routes/config.routes'
import { startRetentionCron } from './lib/retentionCron'

const app: Application = express()
const PORT = process.env.PORT || 5000

app.set('trust proxy', 1) // Railway / any reverse proxy — required for rate-limit IP detection
app.use(helmet())

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.WEBSITE_URL || 'http://localhost:3003',
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Patient API is running' })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/chat', chatLimiter, chatRoutes)
app.use('/api/doctors', doctorsRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/symptoms', symptomsRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/config', configRoutes)

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  try {
    await connectDatabase()
    startRetentionCron()
    app.listen(PORT, () => {
      console.log(`🚀 Patient API running on port ${PORT}`)
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err)
  process.exit(1)
})

startServer()

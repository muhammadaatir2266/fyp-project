import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes'
import adminRoutes from './routes/admin.routes'
import apiRoutes from './routes/api.routes'

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3002',
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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/v1', apiRoutes)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Admin API is running' })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Admin API server running on port ${PORT}`)
})

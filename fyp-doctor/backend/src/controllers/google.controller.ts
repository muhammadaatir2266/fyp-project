import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../config/database'
import {
  isGoogleConfigured,
  getConsentUrl,
  exchangeCodeForTokens,
  encryptToken,
  revokeToken,
} from '../lib/google-calendar'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production' // validated in lib/jwt.ts at startup
const SUCCESS_REDIRECT =
  process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT ||
  `${process.env.FRONTEND_URL || 'http://localhost:3001'}/availability`

/** GET /api/doctor/google/connect — returns the Google consent URL. */
export const connectGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isGoogleConfigured()) {
      res.status(503).json({ message: 'Google Calendar integration is not configured.' })
      return
    }
    const doctorId = req.doctorId!
    // Signed, short-lived state so the public callback can trust the doctor id.
    const state = jwt.sign({ doctorId }, JWT_SECRET, { expiresIn: '10m' })
    const url = getConsentUrl(state)
    res.json({ url })
  } catch (error) {
    console.error('Google connect error:', error)
    res.status(500).json({ message: 'Failed to start Google connection' })
  }
}

/** GET /api/doctor/google/callback — public; Google redirects the browser here. */
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state, error: oauthError } = req.query as {
    code?: string
    state?: string
    error?: string
  }

  const redirectWith = (status: string) => {
    const sep = SUCCESS_REDIRECT.includes('?') ? '&' : '?'
    res.redirect(`${SUCCESS_REDIRECT}${sep}google=${status}`)
  }

  try {
    if (oauthError || !code || !state) {
      redirectWith('error')
      return
    }

    let doctorId: string
    try {
      const decoded = jwt.verify(state, JWT_SECRET) as { doctorId: string }
      doctorId = decoded.doctorId
    } catch {
      redirectWith('error')
      return
    }

    const { refreshToken, email, calendarId } = await exchangeCodeForTokens(code)

    if (!refreshToken) {
      // Google omits the refresh token when the account already granted access
      // without prompt=consent. We force consent, so treat this as a failure.
      redirectWith('error')
      return
    }

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        googleCalendarConnected: true,
        googleRefreshToken: encryptToken(refreshToken),
        googleCalendarEmail: email,
        googleCalendarId: calendarId,
      },
    })

    redirectWith('connected')
  } catch (error) {
    console.error('Google callback error:', error)
    redirectWith('error')
  }
}

/** POST /api/doctor/google/disconnect — revoke token + clear stored fields. */
export const disconnectGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { googleCalendarConnected: true, googleRefreshToken: true, googleCalendarId: true },
    })

    if (doctor) {
      await revokeToken(doctor)
    }

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        googleCalendarConnected: false,
        googleRefreshToken: null,
        googleCalendarEmail: null,
        googleCalendarId: 'primary',
      },
    })

    res.json({ connected: false })
  } catch (error) {
    console.error('Google disconnect error:', error)
    res.status(500).json({ message: 'Failed to disconnect Google Calendar' })
  }
}

/** GET /api/doctor/google/status — { configured, connected, email }. */
export const googleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { googleCalendarConnected: true, googleCalendarEmail: true },
    })

    res.json({
      configured: isGoogleConfigured(),
      connected: Boolean(doctor?.googleCalendarConnected),
      email: doctor?.googleCalendarEmail ?? null,
    })
  } catch (error) {
    console.error('Google status error:', error)
    res.status(500).json({ message: 'Failed to get Google status' })
  }
}

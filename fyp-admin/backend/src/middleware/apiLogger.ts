import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'

// Fields to mask in logged request bodies to prevent PHI appearing in ApiLog.
const PHI_FIELDS = new Set([
  'patientPhone', 'patientEmail', 'patientName', 'phone', 'email',
  'medicalHistory', 'allergies', 'dateOfBirth', 'reason', 'password',
])

function redactBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return body ? JSON.stringify(body) : null
  const redacted: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    redacted[k] = PHI_FIELDS.has(k) ? '[redacted]' : v
  }
  return JSON.stringify(redacted)
}

// Only log status code and endpoint for responses — never persist response bodies
// containing patient records. Request bodies are redacted of PHI keys above.
const apiLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.on('finish', async () => {
    try {
      if (req.tokenId) {
        await prisma.apiLog.create({
          data: {
            tokenId: req.tokenId,
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            requestBody: redactBody(req.body),
            responseBody: null, // never persist response bodies
            ipAddress: req.ip ?? (req.socket.remoteAddress ?? null),
            userAgent: req.headers['user-agent'] ?? null,
          },
        })
      }
    } catch (error) {
      console.error('API logging error:', error)
    }
  })

  next()
}

export default apiLoggerMiddleware

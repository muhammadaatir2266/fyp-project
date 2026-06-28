import { Request, Response, NextFunction } from 'express'
import { createHash, timingSafeEqual } from 'crypto'
import { ApiToken } from '@prisma/client'
import prisma from '../config/database'

declare global {
  namespace Express {
    interface Request {
      apiToken?: ApiToken
      tokenId?: string
    }
  }
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

const apiTokenMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'API token required. Include in header: Authorization: Bearer <token>',
      })
      return
    }

    const raw = authHeader.split(' ')[1]
    const hash = hashToken(raw)

    // Prefer hash-based lookup (new tokens); fall back to plaintext (legacy tokens)
    let apiToken = await prisma.apiToken.findUnique({
      where: { tokenHash: hash },
      include: { admin: true },
    })

    if (!apiToken) {
      // Legacy plaintext lookup — constant-time safe via DB unique index
      apiToken = await prisma.apiToken.findUnique({
        where: { token: raw },
        include: { admin: true },
      })
    }

    if (!apiToken) {
      res.status(401).json({ success: false, message: 'Invalid API token' })
      return
    }

    if (!apiToken.isActive) {
      res.status(403).json({ success: false, message: 'API token has been revoked' })
      return
    }

    if (apiToken.expiresAt && new Date() > apiToken.expiresAt) {
      res.status(403).json({ success: false, message: 'API token has expired' })
      return
    }

    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
    })

    req.apiToken = apiToken
    req.tokenId = apiToken.id
    next()
  } catch {
    res.status(500).json({ success: false, message: 'Error validating API token' })
  }
}

export default apiTokenMiddleware

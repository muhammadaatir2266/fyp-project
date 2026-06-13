import { Request, Response, NextFunction } from 'express'
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

    const token = authHeader.split(' ')[1]

    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { admin: true },
    })

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

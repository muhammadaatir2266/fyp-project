import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../lib/jwt'
import prisma from '../config/database'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { doctor?: { id: string } }
      doctorId?: string
    }
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      res.status(401).json({ message: 'Authentication required' })
      return
    }

    const decoded = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { doctor: true },
    })

    if (!user || user.role !== 'DOCTOR') {
      res.status(403).json({ message: 'Access denied. Doctor role required.' })
      return
    }

    req.user = { userId: user.id, role: user.role, doctor: user.doctor ?? undefined }
    req.doctorId = user.doctor!.id
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export default authMiddleware

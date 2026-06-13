import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../lib/jwt'
import prisma from '../config/database'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      adminId?: string
    }
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      res.status(401).json({ message: 'No token provided' })
      return
    }

    const decoded = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { admin: true },
    })

    if (!user || user.role !== 'ADMIN' || !user.admin) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    if (!user.admin.isActive) {
      res.status(403).json({ message: 'Admin account is deactivated' })
      return
    }

    req.user = { userId: user.id, role: user.role }
    req.adminId = user.admin.id
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export default authMiddleware

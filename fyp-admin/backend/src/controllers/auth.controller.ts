import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import { generateToken } from '../lib/jwt'

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string }

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true },
    })

    if (!user || user.role !== 'ADMIN' || !user.admin) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    if (!user.admin.isActive) {
      res.status(403).json({ message: 'Admin account is deactivated' })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = generateToken({ userId: user.id, role: user.role })

    res.json({
      token,
      admin: {
        id: user.admin.id,
        firstName: user.admin.firstName,
        lastName: user.admin.lastName,
        email: user.email,
        isSuperAdmin: user.admin.isSuperAdmin,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId! },
      include: { user: { select: { email: true } } },
    })

    res.json(admin)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

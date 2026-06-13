import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId! },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    })

    if (!admin) {
      res.status(404).json({ message: 'Admin not found' })
      return
    }

    res.json(admin)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone } = req.body as {
      firstName?: string
      lastName?: string
      phone?: string
    }

    if (!firstName || !lastName) {
      res.status(400).json({ message: 'First name and last name are required' })
      return
    }

    const admin = await prisma.admin.update({
      where: { id: req.adminId! },
      data: { firstName, lastName, phone },
      select: { id: true, firstName: true, lastName: true, phone: true },
    })

    res.json({ message: 'Profile updated successfully', admin })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ message: 'All password fields are required' })
      return
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ message: 'New password and confirmation do not match' })
      return
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long' })
      return
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.adminId! },
      include: { user: true },
    })

    if (!admin) {
      res.status(404).json({ message: 'Admin not found' })
      return
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.user.password)

    if (!isValidPassword) {
      res.status(401).json({ message: 'Current password is incorrect' })
      return
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: admin.userId },
      data: { password: hashedPassword },
    })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { AppError } from '../middleware/error.middleware'

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
})

export const getProfile = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
      include: { user: { select: { email: true } } },
    })

    if (!patient) throw new AppError('Patient profile not found', 404)

    res.json({
      ...patient,
      email: patient.user.email,
    })
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
}

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body)

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
    })
    if (!patient) throw new AppError('Patient profile not found', 404)

    const updated = await prisma.patient.update({
      where: { userId: req.user!.userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
        ...(data.medicalHistory !== undefined && { medicalHistory: data.medicalHistory }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
      },
      include: { user: { select: { email: true } } },
    })

    res.json({ ...updated, email: updated.user.email })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AppError('User not found', 404)

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new AppError('Current password is incorrect', 400)

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.user!.userId }, data: { password: hashed } })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to change password' })
  }
}

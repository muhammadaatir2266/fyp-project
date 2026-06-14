import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import { cityCentroid } from '../lib/geocode'

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { availableFrom: true, availableTo: true, workingDays: true, unavailableDates: true },
    })

    res.json(doctor)
  } catch (error) {
    console.error('Get availability error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!
    const { availableFrom, availableTo, workingDays, unavailableDates } = req.body as {
      availableFrom?: string
      availableTo?: string
      workingDays?: string[]
      unavailableDates?: string[]
    }

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        availableFrom,
        availableTo,
        workingDays,
        ...(unavailableDates && { unavailableDates }),
      },
    })

    res.json(doctor)
  } catch (error) {
    console.error('Update availability error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { specialty: true, user: { select: { email: true } } },
    })

    res.json(doctor)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!
    const { firstName, lastName, phone, address, city, qualifications, experience, consultationFee, gender, languages } =
      req.body as {
        firstName?: string
        lastName?: string
        phone?: string
        address?: string
        city?: string
        qualifications?: string
        experience?: number | string
        consultationFee?: number | string
        gender?: string
        languages?: string[]
      }

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
        ...(city && (cityCentroid(city) ?? {})),
        ...(qualifications && { qualifications }),
        ...(experience !== undefined && { experience: parseInt(String(experience)) }),
        ...(consultationFee !== undefined && { consultationFee: parseFloat(String(consultationFee)) }),
        ...(gender && { gender: gender as any }),
        ...(languages !== undefined && { languages }),
      },
      include: { specialty: true },
    })

    res.json(doctor)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string
      newPassword: string
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    const isPasswordValid = await bcrypt.compare(currentPassword, user!.password)

    if (!isPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' })
      return
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateNotificationSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailNotifications, smsNotifications } = req.body as {
      emailNotifications?: boolean
      smsNotifications?: boolean
    }

    res.json({ message: 'Notification settings updated', emailNotifications, smsNotifications })
  } catch (error) {
    console.error('Update notification settings error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

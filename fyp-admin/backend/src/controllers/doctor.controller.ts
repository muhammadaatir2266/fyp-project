import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { DoctorVerificationStatus } from '@prisma/client'
import prisma from '../config/database'

export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, specialty, status, verificationStatus } = req.query as Record<string, string | undefined>

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    if (specialty) where.specialtyId = specialty
    if (status === 'active') where.isActive = true
    else if (status === 'inactive') where.isActive = false

    if (verificationStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(verificationStatus)) {
      where.verificationStatus = verificationStatus as DoctorVerificationStatus
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        specialty: true,
        user: { select: { email: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(doctors)
  } catch (error) {
    console.error('Get doctors error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        specialty: true,
        user: { select: { email: true } },
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: { patient: true },
        },
      },
    })

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' })
      return
    }

    res.json(doctor)
  } catch (error) {
    console.error('Get doctor error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, specialtyId, phone, address, city, qualifications, experience, consultationFee } =
      req.body as Record<string, string>

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'DOCTOR',
        doctor: {
          create: {
            firstName,
            lastName,
            specialtyId,
            phone,
            address,
            city,
            qualifications,
            experience: parseInt(experience) || 0,
            consultationFee: parseFloat(consultationFee) || 0,
          },
        },
      },
      include: { doctor: { include: { specialty: true } } },
    })

    res.status(201).json(user.doctor)
  } catch (error) {
    console.error('Create doctor error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const doctor = await prisma.doctor.update({
      where: { id },
      data: req.body,
      include: { specialty: true, user: { select: { email: true } } },
    })

    res.json(doctor)
  } catch (error) {
    console.error('Update doctor error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    await prisma.doctor.delete({ where: { id } })

    res.json({ message: 'Doctor deleted successfully' })
  } catch (error) {
    console.error('Delete doctor error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const toggleDoctorStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const doctor = await prisma.doctor.findUnique({ where: { id } })

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' })
      return
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: { isActive: !doctor.isActive },
      include: { specialty: true, user: { select: { email: true } } },
    })

    res.json(updatedDoctor)
  } catch (error) {
    console.error('Toggle doctor status error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const approveDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const adminUserId = req.user!.userId

    const doctor = await prisma.doctor.findUnique({ where: { id } })

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' })
      return
    }

    if (doctor.verificationStatus === 'APPROVED') {
      res.status(400).json({ message: 'Doctor is already approved' })
      return
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        isActive: true,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
      },
      include: { specialty: true, user: { select: { email: true } } },
    })

    res.json({ message: 'Doctor approved successfully', doctor: updatedDoctor })
  } catch (error) {
    console.error('Approve doctor error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const rejectDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const { notes } = req.body as { notes?: string }
    const adminUserId = req.user!.userId

    if (!notes || notes.trim() === '') {
      res.status(400).json({ message: 'Rejection notes are required' })
      return
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } })

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' })
      return
    }

    if (doctor.verificationStatus === 'REJECTED') {
      res.status(400).json({ message: 'Doctor is already rejected' })
      return
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        isActive: false,
        verificationNotes: notes,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
      },
      include: { specialty: true, user: { select: { email: true } } },
    })

    res.json({ message: 'Doctor rejected successfully', doctor: updatedDoctor })
  } catch (error) {
    console.error('Reject doctor error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getVerificationDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { verificationDocument: true },
    })

    if (!doctor || !doctor.verificationDocument) {
      res.status(404).json({ message: 'Document not found' })
      return
    }

    const filePath = path.join(__dirname, '../..', doctor.verificationDocument)
    const normalizedPath = path.normalize(filePath)
    const uploadsDir = path.join(__dirname, '../..', 'uploads')

    if (!normalizedPath.startsWith(uploadsDir)) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    if (!fs.existsSync(normalizedPath)) {
      res.status(404).json({ message: 'Document file not found' })
      return
    }

    res.sendFile(normalizedPath)
  } catch (error) {
    console.error('Get verification document error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

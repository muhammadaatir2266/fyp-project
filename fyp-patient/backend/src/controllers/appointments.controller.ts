import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { AppError } from '../middleware/error.middleware'

const bookSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  scheduledAt: z.string().datetime('Invalid datetime (ISO 8601 required)'),
  reason: z.string().optional(),
  duration: z.number().int().min(15).max(120).default(30),
})

const updateSchema = z.object({
  status: z.enum(['CANCELLED']).optional(),
  scheduledAt: z.string().datetime().optional(),
  reason: z.string().optional(),
})

async function getPatientId(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } })
  if (!patient) throw new AppError('Patient profile not found', 404)
  return patient.id
}

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const patientId = await getPatientId(req.user!.userId)
    const { status, upcoming } = req.query as Record<string, string>

    const where: any = { patientId }
    if (status) where.status = status
    if (upcoming === 'true') {
      where.scheduledAt = { gte: new Date() }
      where.status = { in: ['PENDING', 'CONFIRMED'] }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { specialty: true } },
        review: { select: { id: true, rating: true, comment: true, createdAt: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    res.json(appointments)
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    console.error('Get appointments error:', error)
    res.status(500).json({ error: 'Failed to fetch appointments' })
  }
}

export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const patientId = await getPatientId(req.user!.userId)
    const data = bookSchema.parse(req.body)

    // Verify doctor exists and is active
    const doctor = await prisma.doctor.findFirst({
      where: { id: data.doctorId, isActive: true, isVerified: true },
    })
    if (!doctor) throw new AppError('Doctor not found or not available', 404)

    // Check slot not already taken
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        scheduledAt: new Date(data.scheduledAt),
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })
    if (conflict) throw new AppError('This slot is already booked', 409)

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: data.doctorId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        reason: data.reason,
        source: 'PATIENT_APP',
        status: 'PENDING',
      },
      include: { doctor: { include: { specialty: true } } },
    })

    res.status(201).json(appointment)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    console.error('Book appointment error:', error)
    res.status(500).json({ error: 'Failed to book appointment' })
  }
}

export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const patientId = await getPatientId(req.user!.userId)
    const { id } = req.params

    const appointment = await prisma.appointment.findFirst({
      where: { id, patientId },
      include: { doctor: { include: { specialty: true } } },
    })

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appointment)
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to fetch appointment' })
  }
}

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const patientId = await getPatientId(req.user!.userId)
    const { id } = req.params
    const data = updateSchema.parse(req.body)

    const existing = await prisma.appointment.findFirst({ where: { id, patientId } })
    if (!existing) return res.status(404).json({ error: 'Appointment not found' })

    if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
      throw new AppError('Cannot modify a cancelled or completed appointment', 400)
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.status === 'CANCELLED' && { cancelledBy: 'PATIENT' }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.reason !== undefined && { reason: data.reason }),
      },
      include: { doctor: { include: { specialty: true } } },
    })

    res.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to update appointment' })
  }
}

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { AppError } from '../middleware/error.middleware'
import { buildBookedMap, validateScheduledSlot } from '../lib/availability'
import { createRetellWebCall } from '../lib/retell'

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

const callIntentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
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
    const scheduledAt = new Date(data.scheduledAt)

    // Verify doctor exists and is active
    const doctor = await prisma.doctor.findFirst({
      where: { id: data.doctorId, isActive: true, isVerified: true },
      select: {
        id: true,
        availableFrom: true,
        availableTo: true,
        workingDays: true,
        unavailableDates: true,
      },
    })
    if (!doctor) throw new AppError('Doctor not found or not available', 404)

    // Load booked slots for the same day
    const dayStart = new Date(scheduledAt)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(scheduledAt)
    dayEnd.setHours(23, 59, 59, 999)

    const dayAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: data.doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { scheduledAt: true },
    })

    const bookedMap = buildBookedMap(dayAppointments.map((a) => a.scheduledAt))
    const dateStr = scheduledAt.toISOString().split('T')[0]
    const bookedTimesForDay = bookedMap.get(dateStr) ?? new Set<string>()

    const validation = validateScheduledSlot(doctor, scheduledAt, bookedTimesForDay)
    if (!validation.valid) throw new AppError(validation.error!, 400)

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: data.doctorId,
        scheduledAt,
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

    const existing = await prisma.appointment.findFirst({
      where: { id, patientId },
      include: {
        doctor: {
          select: {
            availableFrom: true,
            availableTo: true,
            workingDays: true,
            unavailableDates: true,
          },
        },
      },
    })
    if (!existing) return res.status(404).json({ error: 'Appointment not found' })

    if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
      throw new AppError('Cannot modify a cancelled or completed appointment', 400)
    }

    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status
      if (data.status === 'CANCELLED') updateData.cancelledBy = 'PATIENT'
    }

    if (data.reason !== undefined) updateData.reason = data.reason

    if (data.scheduledAt) {
      const scheduledAt = new Date(data.scheduledAt)

      // Load booked slots for the requested day, excluding this appointment
      const dayStart = new Date(scheduledAt)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(scheduledAt)
      dayEnd.setHours(23, 59, 59, 999)

      const dayAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: existing.doctorId,
          scheduledAt: { gte: dayStart, lte: dayEnd },
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: id }, // exclude current appointment
        },
        select: { scheduledAt: true },
      })

      const bookedMap = buildBookedMap(dayAppointments.map((a) => a.scheduledAt))
      const dateStr = scheduledAt.toISOString().split('T')[0]
      const bookedTimesForDay = bookedMap.get(dateStr) ?? new Set<string>()

      const validation = validateScheduledSlot(existing.doctor, scheduledAt, bookedTimesForDay, id)
      if (!validation.valid) throw new AppError(validation.error!, 400)

      updateData.scheduledAt = scheduledAt

      // CONFIRMED → PENDING on reschedule (per product spec)
      if (existing.status === 'CONFIRMED') {
        updateData.status = 'PENDING'
        updateData.confirmedAt = null
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: { doctor: { include: { specialty: true } } },
    })

    res.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to update appointment' })
  }
}

export const createVoiceCall = async (req: Request, res: Response) => {
  try {
    const patientId = await getPatientId(req.user!.userId)
    const { doctorId } = callIntentSchema.parse(req.body)

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { firstName: true, lastName: true, phone: true },
    })
    if (!patient) throw new AppError('Patient profile not found', 404)

    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, isActive: true, isVerified: true },
      select: { id: true, firstName: true, lastName: true, specialty: { select: { name: true } } },
    })
    if (!doctor) throw new AppError('Doctor not found or not available', 404)

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min TTL

    // One active intent per patient at a time
    await prisma.callBookingIntent.deleteMany({ where: { patientId } })

    const intent = await prisma.callBookingIntent.create({
      data: {
        patientId,
        doctorId,
        phone: patient.phone ?? null,
        expiresAt,
      },
    })

    const patientName = `${patient.firstName} ${patient.lastName}`
    const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`
    const doctorSpecialty = doctor.specialty?.name ?? 'General Medicine'

    let accessToken: string
    let callId: string

    try {
      const retellCall = await createRetellWebCall({
        doctorId: doctor.id,
        doctorName,
        doctorSpecialty,
        patientId,
        patientName,
        intentId: intent.id,
      })
      accessToken = retellCall.accessToken
      callId = retellCall.callId

      // Store Retell call ID on intent for webhook correlation
      await prisma.callBookingIntent.update({
        where: { id: intent.id },
        data: { retellCallId: callId },
      })
    } catch (retellErr) {
      console.error('Retell createWebCall failed:', retellErr)
      // Clean up intent if Retell registration failed
      await prisma.callBookingIntent.delete({ where: { id: intent.id } }).catch(() => {})
      throw new AppError('Failed to start voice call. Please try again or book online.', 503)
    }

    res.json({
      accessToken,
      callId,
      intentId: intent.id,
      doctorName,
      doctorSpecialty,
      patientName,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    console.error('Create voice call error:', error)
    res.status(500).json({ error: 'Failed to create voice call' })
  }
}

// Kept as alias for backward compatibility
export const createCallIntent = createVoiceCall

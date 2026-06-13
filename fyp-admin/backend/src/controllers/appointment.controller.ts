import { Request, Response } from 'express'
import { AppointmentStatus, BookingSource } from '@prisma/client'
import prisma from '../config/database'

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, status, source, startDate, endDate } = req.query as Record<string, string | undefined>

    const where: {
      doctorId?: string
      status?: AppointmentStatus
      source?: BookingSource
      scheduledAt?: { gte: Date; lte: Date }
    } = {}

    if (doctorId) where.doctorId = doctorId
    if (status && status !== 'ALL') where.status = status as AppointmentStatus
    if (source && source !== 'ALL') where.source = source as BookingSource
    if (startDate && endDate) {
      where.scheduledAt = { gte: new Date(startDate), lte: new Date(endDate) }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: { include: { specialty: true } } },
      orderBy: { scheduledAt: 'desc' },
    })

    res.json(appointments)
  } catch (error) {
    console.error('Get appointments error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: { include: { specialty: true } } },
    })

    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' })
      return
    }

    res.json(appointment)
  } catch (error) {
    console.error('Get appointment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const { status, notes } = req.body as { status?: string; notes?: string }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status: status as AppointmentStatus }),
        ...(notes && { notes }),
      },
      include: { patient: true, doctor: { include: { specialty: true } } },
    })

    res.json(appointment)
  } catch (error) {
    console.error('Update appointment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { patient: true, doctor: true },
    })

    res.json(appointment)
  } catch (error) {
    console.error('Cancel appointment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

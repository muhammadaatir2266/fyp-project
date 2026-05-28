import { Request, Response } from 'express'
import { AppointmentStatus } from '@prisma/client'
import prisma from '../config/database'

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!
    const status = req.query.status as string | undefined

    const where: { doctorId: string; status?: AppointmentStatus } = { doctorId }
    if (status && status !== 'ALL') {
      where.status = status as AppointmentStatus
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { patient: true },
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
    const doctorId = req.doctorId!

    const appointment = await prisma.appointment.findFirst({
      where: { id, doctorId },
      include: { patient: true },
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
    const doctorId = req.doctorId!
    const { status, notes, scheduledAt } = req.body as {
      status?: string
      notes?: string
      scheduledAt?: string
    }

    const existing = await prisma.appointment.findFirst({ where: { id, doctorId } })

    if (!existing) {
      res.status(404).json({ message: 'Appointment not found' })
      return
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status: status as AppointmentStatus }),
        ...(notes && { notes }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      },
      include: { patient: true },
    })

    res.json(updated)
  } catch (error) {
    console.error('Update appointment error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

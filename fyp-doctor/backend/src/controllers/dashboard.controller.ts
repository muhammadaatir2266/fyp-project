import { Request, Response } from 'express'
import prisma from '../config/database'

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const [todayAppointments, upcomingAppointments, patientRows, recentCalls] = await Promise.all([
      prisma.appointment.count({
        where: { doctorId, scheduledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { doctorId, scheduledAt: { gte: tomorrow, lte: sevenDaysFromNow } },
      }),
      prisma.appointment.findMany({
        where: { doctorId },
        distinct: ['patientId'],
      }),
      prisma.callLog.count({
        where: { doctorId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ])

    const totalPatients = patientRows.length

    const aiActivity = await prisma.prediction.count({
      where: {
        chatSession: {
          patient: { appointments: { some: { doctorId } } },
        },
      },
    })

    res.json({ todayAppointments, upcomingAppointments, totalPatients, recentCalls, aiActivity })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getTodayAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const appointments = await prisma.appointment.findMany({
      where: { doctorId, scheduledAt: { gte: today, lt: tomorrow } },
      include: { patient: true },
      orderBy: { scheduledAt: 'asc' },
    })

    res.json(appointments)
  } catch (error) {
    console.error('Get today appointments error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getRecentCalls = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!

    const calls = await prisma.callLog.findMany({
      where: { doctorId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    })

    res.json(calls)
  } catch (error) {
    console.error('Get recent calls error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

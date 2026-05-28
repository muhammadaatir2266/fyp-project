import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'

export const getPatientSymptoms = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    })
    if (!patient) throw new AppError('Patient profile not found', 404)

    const symptoms = await prisma.patientSymptom.findMany({
      where: { patientId: patient.id },
      include: {
        symptom: true,
        chatSession: { select: { id: true, startedAt: true } },
      },
      orderBy: { reportedAt: 'desc' },
    })

    res.json(symptoms)
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to fetch symptoms' })
  }
}

export const getHistory = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    })
    if (!patient) throw new AppError('Patient profile not found', 404)

    const limit = Math.min(50, parseInt((req.query.limit as string) || '10'))

    const sessions = await prisma.chatSession.findMany({
      where: { patientId: patient.id },
      include: {
        predictions: {
          include: { disease: { include: { recommendedSpecialty: true } } },
          orderBy: { confidence: 'desc' },
          take: 3,
        },
        messages: {
          where: { role: 'user' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    })

    res.json(sessions)
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
    res.status(500).json({ error: 'Failed to fetch history' })
  }
}

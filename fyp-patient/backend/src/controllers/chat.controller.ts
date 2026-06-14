import { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { z } from 'zod'

const messageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  location: z.string().optional(),
  sessionId: z.string().uuid().optional(),
})

const guestMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  guestSessionId: z.string().uuid('guestSessionId must be a valid UUID'),
  location: z.string().optional(),
})

const WEBHOOK_URL =
  process.env.N8N_CHAT_WEBHOOK_URL ||
  'https://fyp2026.app.n8n.cloud/webhook/55479a0c-6a9f-4083-ad95-8cbe28d9e828'

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, location, sessionId } = messageSchema.parse(req.body)

    if (!req.user) throw new AppError('Authentication required', 401)

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { patient: true },
    })

    if (!user?.patient) throw new AppError('Patient profile not found', 404)

    const patient = user.patient

    // Find or create a ChatSession
    let session = sessionId
      ? await prisma.chatSession.findFirst({ where: { id: sessionId, patientId: patient.id } })
      : null

    if (!session) {
      session = await prisma.chatSession.create({
        data: { patientId: patient.id },
      })
    }

    // Persist the user's message
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'user',
        content: message,
      },
    })

    // Build webhook payload
    const webhookPayload = {
      patient_id: patient.id,
      session_id: session.id,
      message,
      user_info: {
        email: user.email,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
      },
      location: location || patient.city,
      timestamp: new Date().toISOString(),
    }

    // Call n8n webhook
    const webhookResponse = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })

    const n8nData = webhookResponse.data
    let responseMessage = ''

    if (typeof n8nData === 'string') {
      responseMessage = n8nData
    } else if (n8nData?.data) {
      if (typeof n8nData.data === 'string') responseMessage = n8nData.data
      else responseMessage = n8nData.data.message || n8nData.data.response || ''
    } else {
      responseMessage = n8nData?.message || n8nData?.response || 'I received your message. How can I help you?'
    }

    // Persist the assistant reply
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'assistant',
        content: responseMessage,
      },
    })

    // Persist predictions if returned by n8n
    const predictions: Array<{ disease: string; confidence: number }> = n8nData?.prediction || n8nData?.predictions || []
    if (predictions.length > 0) {
      for (const pred of predictions) {
        const diseaseName = typeof pred === 'string' ? pred : pred.disease
        const confidence = typeof pred === 'object' ? (pred.confidence ?? 1.0) : 1.0

        let disease = await prisma.disease.findUnique({ where: { name: diseaseName } })
        if (!disease) {
          disease = await prisma.disease.create({
            data: { name: diseaseName, precautions: [] },
          })
        }

        await prisma.prediction.create({
          data: {
            chatSessionId: session.id,
            diseaseId: disease.id,
            confidence,
            inputSymptoms: n8nData?.symptoms || [],
          },
        })
      }
    }

    // Persist reported symptoms if returned
    const reportedSymptoms: string[] = n8nData?.symptoms || []
    if (reportedSymptoms.length > 0) {
      for (const symptomName of reportedSymptoms) {
        let symptom = await prisma.symptom.findUnique({ where: { name: symptomName } })
        if (!symptom) {
          symptom = await prisma.symptom.create({ data: { name: symptomName } })
        }
        // Avoid duplicate entries for this session
        const exists = await prisma.patientSymptom.findFirst({
          where: { patientId: patient.id, symptomId: symptom.id, chatSessionId: session.id },
        })
        if (!exists) {
          await prisma.patientSymptom.create({
            data: {
              patientId: patient.id,
              symptomId: symptom.id,
              chatSessionId: session.id,
            },
          })
        }
      }
    }

    res.json({
      success: true,
      sessionId: session.id,
      data: {
        message: responseMessage,
        prediction: n8nData?.prediction || n8nData?.predictions,
        doctors: n8nData?.doctors,
        symptoms: n8nData?.symptoms,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    if (axios.isAxiosError(error)) {
      console.error('Webhook error:', error.response?.data || error.message)
      return next(new AppError('Failed to process message. Please try again later.', 503))
    }
    next(error)
  }
}

// Stateless guest endpoint — n8n proxy only, no DB writes, no doctor data exposed
export const sendGuestMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, guestSessionId, location } = guestMessageSchema.parse(req.body)

    const webhookPayload = {
      guest_session_id: guestSessionId,
      message,
      location: location || null,
      timestamp: new Date().toISOString(),
    }

    const webhookResponse = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })

    const n8nData = webhookResponse.data
    let responseMessage = ''

    if (typeof n8nData === 'string') {
      responseMessage = n8nData
    } else if (n8nData?.data) {
      if (typeof n8nData.data === 'string') responseMessage = n8nData.data
      else responseMessage = n8nData.data.message || n8nData.data.response || ''
    } else {
      responseMessage = n8nData?.message || n8nData?.response || 'I received your message. How can I help you?'
    }

    const rawPredictions: Array<{ disease: string; confidence: number }> = n8nData?.prediction || n8nData?.predictions || []
    const predictions = rawPredictions.map((p) =>
      typeof p === 'string' ? { disease: p, confidence: 1.0 } : { disease: p.disease, confidence: p.confidence ?? 1.0 }
    )

    res.json({
      success: true,
      diseaseDetected: predictions.length > 0,
      data: {
        message: responseMessage,
        prediction: predictions.length > 0 ? predictions : undefined,
        symptoms: n8nData?.symptoms,
        // doctors intentionally omitted for guests
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    if (axios.isAxiosError(error)) {
      console.error('Guest webhook error:', error.response?.data || error.message)
      return next(new AppError('Failed to process message. Please try again later.', 503))
    }
    next(error)
  }
}

export const getChatSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401)

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.userId }, select: { id: true } })
    if (!patient) throw new AppError('Patient not found', 404)

    const sessions = await prisma.chatSession.findMany({
      where: { patientId: patient.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        predictions: { include: { disease: true }, orderBy: { confidence: 'desc' } },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    })

    res.json(sessions)
  } catch (error) {
    next(error)
  }
}

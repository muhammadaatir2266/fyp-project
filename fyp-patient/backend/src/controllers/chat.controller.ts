import { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'
import { z } from 'zod'
import { parseN8nChatResponse } from '../lib/n8n-response'
import { parseCoordString, reverseGeocode } from '../lib/geocode'

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

async function resolveN8nLocation(opts: {
  clientLocation?: string
  patient?: { city: string | null; latitude: number | null; longitude: number | null }
}): Promise<string | null> {
  // 1. Profile city (authenticated) — most reliable, already human-readable
  if (opts.patient?.city?.trim()) return opts.patient.city.trim()

  // 2. GPS coords: client string first, then profile lat/lng
  const fromClient = opts.clientLocation ? parseCoordString(opts.clientLocation) : null
  const lat = fromClient?.lat ?? opts.patient?.latitude ?? null
  const lng = fromClient?.lng ?? opts.patient?.longitude ?? null

  if (lat != null && lng != null) {
    const place = await reverseGeocode(lat, lng)
    if (place) return place
    // Geocoding unavailable — fall back to raw coords so n8n still gets something
    return `${lat},${lng}`
  }

  // 3. Client sent a plain city/area string (not coords)
  if (opts.clientLocation?.trim() && !parseCoordString(opts.clientLocation)) {
    return opts.clientLocation.trim()
  }

  return null
}

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
      // Stable key for n8n Postgres chat memory. Reuses the guest thread's key
      // when this session was claimed from a guest, so memory continues across signup.
      conversation_id: session.memoryKey ?? session.id,
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
        city: patient.city,
      },
      location: await resolveN8nLocation({ clientLocation: location, patient }),
      timestamp: new Date().toISOString(),
    }

    // Call n8n webhook
    const webhookResponse = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })

    const n8nData = webhookResponse.data
    console.log('[n8n raw response]', JSON.stringify(n8nData))
    const parsed = parseN8nChatResponse(n8nData)
    const responseMessage = parsed.message
    const normalizedPredictions = parsed.predictions
    const reportedSymptoms = parsed.symptoms

    // Persist the assistant reply
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'assistant',
        content: responseMessage,
      },
    })

    // Persist predictions if returned by n8n
    if (normalizedPredictions.length > 0) {
      for (const pred of normalizedPredictions) {
        // Resolve specialty if provided
        let specialtyId: string | undefined
        if (pred.specialty) {
          let specialty = await prisma.specialty.findFirst({
            where: { name: { equals: pred.specialty, mode: 'insensitive' } },
          })
          if (!specialty) {
            specialty = await prisma.specialty.create({ data: { name: pred.specialty } })
          }
          specialtyId = specialty.id
        }

        // Find or create the disease; update recommendedSpecialty if we now have one
        let disease = await prisma.disease.findUnique({ where: { name: pred.disease } })
        if (!disease) {
          disease = await prisma.disease.create({
            data: {
              name: pred.disease,
              precautions: [],
              ...(specialtyId && { recommendedSpecialtyId: specialtyId }),
            },
          })
        } else if (specialtyId && !disease.recommendedSpecialtyId) {
          disease = await prisma.disease.update({
            where: { id: disease.id },
            data: { recommendedSpecialtyId: specialtyId },
          })
        }

        await prisma.prediction.create({
          data: {
            chatSessionId: session.id,
            diseaseId: disease.id,
            confidence: pred.confidence,
            inputSymptoms: reportedSymptoms,
          },
        })
      }
    }

    // Persist reported symptoms if returned
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
        prediction: normalizedPredictions.length > 0 ? normalizedPredictions : undefined,
        symptoms: reportedSymptoms.length > 0 ? reportedSymptoms : undefined,
        doctorRecommendations: parsed.doctorRecommendations,
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
      // Unified memory key (matches authenticated payload) so n8n keys Postgres
      // chat memory on one field for both guest and signed-in conversations.
      conversation_id: guestSessionId,
      message,
      location: await resolveN8nLocation({ clientLocation: location }),
      timestamp: new Date().toISOString(),
    }

    const webhookResponse = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })

    const n8nData = webhookResponse.data
    console.log('[n8n guest raw response]', JSON.stringify(n8nData))
    const parsed = parseN8nChatResponse(n8nData)

    res.json({
      success: true,
      diseaseDetected: parsed.diseaseDetected,
      data: {
        message: parsed.message,
        prediction: parsed.predictions.length > 0 ? parsed.predictions : undefined,
        symptoms: parsed.symptoms.length > 0 ? parsed.symptoms : undefined,
        doctorRecommendations: parsed.doctorRecommendations,
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

const snapshotSchema = z.object({
  guestSessionId: z.string().uuid(),
  predictions: z.array(
    z.object({
      disease: z.string(),
      confidence: z.number(),
      specialty: z.string().optional(),
    })
  ),
  symptoms: z.array(z.string()).optional(),
  specialty: z.string().optional(),
})

const claimSchema = z.object({
  guestSessionId: z.string().uuid(),
})

// Public — stores guest predictions for later claim (TTL 24 h)
export const saveGuestSnapshot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { guestSessionId, predictions, symptoms, specialty } = snapshotSchema.parse(req.body)

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 h

    await prisma.guestChatSnapshot.upsert({
      where: { guestSessionId },
      create: { guestSessionId, predictions, symptoms: symptoms ?? [], specialty, expiresAt },
      update: { predictions, symptoms: symptoms ?? [], specialty, expiresAt },
    })

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    next(error)
  }
}

// Authenticated — attaches snapshot to a real ChatSession + Prediction rows
export const claimGuestSnapshot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401)
    const { guestSessionId } = claimSchema.parse(req.body)

    const snapshot = await prisma.guestChatSnapshot.findUnique({ where: { guestSessionId } })
    if (!snapshot || snapshot.expiresAt < new Date()) {
      // Nothing to claim — silently succeed so the client can proceed
      res.json({ success: true, claimed: false })
      return
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    })
    if (!patient) throw new AppError('Patient not found', 404)

    // Create a chat session to house the predictions
    const session = await prisma.chatSession.create({
      data: {
        patientId: patient.id,
        // Carry the guest UUID forward as the memory key so the n8n Postgres
        // chat thread started as a guest continues seamlessly after signup.
        memoryKey: guestSessionId,
        messages: {
          create: {
            role: 'assistant',
            content: `Based on your earlier symptom analysis, possible conditions were identified. ${
              snapshot.specialty ? `A ${snapshot.specialty} was recommended.` : ''
            }`,
          },
        },
      },
    })

    const rawPredictions = snapshot.predictions as Array<{
      disease: string
      confidence: number
      specialty?: string
    }>

    for (const pred of rawPredictions) {
      let specialtyId: string | undefined
      if (pred.specialty) {
        let sp = await prisma.specialty.findFirst({
          where: { name: { equals: pred.specialty, mode: 'insensitive' } },
        })
        if (!sp) sp = await prisma.specialty.create({ data: { name: pred.specialty } })
        specialtyId = sp.id
      }

      let disease = await prisma.disease.findUnique({ where: { name: pred.disease } })
      if (!disease) {
        disease = await prisma.disease.create({
          data: {
            name: pred.disease,
            precautions: [],
            ...(specialtyId && { recommendedSpecialtyId: specialtyId }),
          },
        })
      } else if (specialtyId && !disease.recommendedSpecialtyId) {
        disease = await prisma.disease.update({
          where: { id: disease.id },
          data: { recommendedSpecialtyId: specialtyId },
        })
      }

      await prisma.prediction.create({
        data: {
          chatSessionId: session.id,
          diseaseId: disease.id,
          confidence: pred.confidence,
          inputSymptoms: (snapshot.symptoms as string[]) ?? [],
        },
      })
    }

    // Delete snapshot so it can't be claimed again
    await prisma.guestChatSnapshot.delete({ where: { guestSessionId } })

    res.json({ success: true, claimed: true, sessionId: session.id })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message })
    if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message })
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

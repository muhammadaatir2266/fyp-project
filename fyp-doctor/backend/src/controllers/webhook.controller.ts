import { Request, Response } from 'express'
import prisma from '../config/database'

interface VapiBody {
  message?: {
    type?: string
    call?: {
      id?: string
      customer?: { number?: string; name?: string }
      metadata?: Record<string, unknown>
      startedAt?: string
      endedAt?: string
      duration?: number
    }
    customer?: { number?: string; name?: string }
    metadata?: Record<string, unknown>
    durationSeconds?: number
    summary?: string
    transcript?: string
    startedAt?: string
    endedAt?: string
  }
  call?: {
    id?: string
    customer?: { number?: string; name?: string }
    metadata?: Record<string, unknown>
    startedAt?: string
    endedAt?: string
    duration?: number
  }
}

interface RetellBody {
  event?: string
  call?: {
    call_id?: string
    from_number?: string
    call_status?: string
    start_timestamp?: number
    end_timestamp?: number
    duration_ms?: number
    metadata?: Record<string, unknown>
  }
  transcript?: string
  transcript_object?: unknown
}

export const vapiWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const vapiSecret = process.env.VAPI_WEBHOOK_SECRET
    if (!vapiSecret && process.env.NODE_ENV === 'production') {
      console.error('FATAL: VAPI_WEBHOOK_SECRET must be set in production.')
      res.status(500).json({ message: 'Server misconfiguration' })
      return
    }
    if (vapiSecret) {
      const incoming = (req.headers['x-vapi-secret'] ?? req.headers['authorization']) as string | undefined
      if (!incoming || !incoming.includes(vapiSecret)) {
        res.status(401).json({ message: 'Unauthorized' })
        return
      }
    }

    const body = req.body as VapiBody
    const msgType = body?.message?.type

    if (msgType && msgType !== 'end-of-call-report') {
      res.json({ received: true })
      return
    }

    const callData = body?.message?.call ?? body?.call
    const metadata = callData?.metadata ?? body?.message?.metadata ?? {}

    const doctorId = metadata?.doctorId as string | undefined
    if (!doctorId) {
      res.json({ received: true, note: 'No doctorId in metadata, log skipped' })
      return
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } })
    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' })
      return
    }

    const callerPhone = callData?.customer?.number ?? body?.message?.customer?.number ?? 'unknown'
    const callerName = callData?.customer?.name ?? body?.message?.customer?.name ?? null
    const vapiCallId = callData?.id ?? body?.message?.call?.id ?? null
    const durationSeconds = body?.message?.durationSeconds ?? callData?.duration ?? null
    const summary = body?.message?.summary ?? null
    const transcript = body?.message?.transcript ?? null
    const startedAtStr = callData?.startedAt ?? body?.message?.startedAt
    const endedAtStr = callData?.endedAt ?? body?.message?.endedAt

    await prisma.callLog.create({
      data: {
        doctorId,
        callerPhone,
        callerName,
        callType: 'INCOMING',
        status: 'COMPLETED',
        startedAt: startedAtStr ? new Date(startedAtStr) : new Date(),
        endedAt: endedAtStr ? new Date(endedAtStr) : null,
        duration: durationSeconds ? Math.round(Number(durationSeconds)) : null,
        summary,
        transcript,
        vapiCallId,
      },
    })

    if (metadata?.appointmentBooked && metadata?.patientId && metadata?.scheduledAt) {
      await prisma.appointment
        .create({
          data: {
            patientId: metadata.patientId as string,
            doctorId,
            scheduledAt: new Date(metadata.scheduledAt as string),
            status: 'CONFIRMED',
            source: 'CALLING_AGENT',
            reason: (metadata.reason as string) || 'Booked via calling agent',
            duration: 30,
          },
        })
        .catch((e) => console.error('Appointment from call failed:', e))
    }

    res.json({ received: true, logged: true })
  } catch (error) {
    console.error('VAPI webhook error:', error)
    res.status(500).json({ message: 'Webhook processing failed' })
  }
}

export const retellWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const retellSecret = process.env.RETELL_WEBHOOK_SECRET
    if (!retellSecret && process.env.NODE_ENV === 'production') {
      console.error('FATAL: RETELL_WEBHOOK_SECRET must be set in production.')
      res.status(500).json({ message: 'Server misconfiguration' })
      return
    }
    if (retellSecret) {
      const incoming = req.headers['x-retell-signature'] as string | undefined
      if (!incoming || incoming !== retellSecret) {
        res.status(401).json({ message: 'Unauthorized' })
        return
      }
    }

    const body = req.body as RetellBody
    const eventType = body?.event

    if (eventType !== 'call_ended') {
      res.json({ received: true })
      return
    }

    const callObj = body?.call
    const metadata = callObj?.metadata ?? {}
    const doctorId = metadata?.doctorId as string | undefined

    if (!doctorId) {
      res.json({ received: true, note: 'No doctorId, log skipped' })
      return
    }

    // For web calls, metadata carries patientId and intentId; from_number will be absent
    const patientId = metadata?.patientId as string | undefined
    const intentId = metadata?.intentId as string | undefined
    const isWebCall = !callObj?.from_number || callObj.from_number === ''
    const callerPhone = isWebCall ? 'web' : (callObj?.from_number ?? 'unknown')

    await prisma.callLog.create({
      data: {
        doctorId,
        callerPhone,
        callerName: (metadata?.callerName as string) ?? null,
        callType: 'INCOMING',
        status: callObj?.call_status === 'error' ? 'FAILED' : 'COMPLETED',
        startedAt: callObj?.start_timestamp ? new Date(callObj.start_timestamp) : new Date(),
        endedAt: callObj?.end_timestamp ? new Date(callObj.end_timestamp) : null,
        duration: callObj?.duration_ms ? Math.round(callObj.duration_ms / 1000) : null,
        summary: body?.transcript_object ? JSON.stringify(body.transcript_object).slice(0, 500) : null,
        transcript: body?.transcript ?? null,
        vapiCallId: callObj?.call_id ?? null,
      },
    })

    if (patientId || intentId) {
      console.info(`[retellWebhook] Web voice call logged — patientId=${patientId ?? 'n/a'} intentId=${intentId ?? 'n/a'} callId=${callObj?.call_id}`)
    }

    res.json({ received: true, logged: true })
  } catch (error) {
    console.error('Retell webhook error:', error)
    res.status(500).json({ message: 'Webhook processing failed' })
  }
}

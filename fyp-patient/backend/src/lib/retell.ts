import Retell from 'retell-sdk'

// Official pattern from the retell-typescript-sdk README.
// apiKey defaults to process.env['RETELL_API_KEY'] when omitted; explicit here for clarity.
export const retellClient = new Retell({
  apiKey: process.env['RETELL_API_KEY'],
})

export interface CreateWebCallOptions {
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  patientId: string
  patientName: string
  patientPhone?: string | null
  patientEmail?: string | null
  intentId: string
}

export async function createRetellWebCall(opts: CreateWebCallOptions) {
  const agentId = process.env['RETELL_AGENT_ID']
  if (!agentId) throw new Error('RETELL_AGENT_ID is not set')

  // Provide the agent with the current date so it can resolve relative dates
  // ("tomorrow", "next Monday") and avoid booking in the past. Anchored to
  // Pakistan time since that's where patients/doctors are.
  const timezone = 'Asia/Karachi'
  const now = new Date()
  const currentDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now) // YYYY-MM-DD
  const currentDay = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  }).format(now)

  const params: Retell.CallCreateWebCallParams = {
    agent_id: agentId,
    metadata: {
      doctorId: opts.doctorId,
      patientId: opts.patientId,
      intentId: opts.intentId,
      callerName: opts.patientName,  // used by webhook handler to populate CallLog.callerName
    },
    retell_llm_dynamic_variables: {
      patient_id: opts.patientId,
      intent_id: opts.intentId,
      doctor_id: opts.doctorId,
      patient_name: opts.patientName,
      patient_phone: opts.patientPhone?.trim() || '',
      patient_email: opts.patientEmail?.trim() || '',
      doctor_name: opts.doctorName,
      doctor_specialty: opts.doctorSpecialty,
      current_date: currentDate,
      current_day: currentDay,
      timezone,
    },
  }

  const response: Retell.WebCallResponse = await retellClient.call.createWebCall(params)

  return {
    accessToken: response.access_token,
    callId: response.call_id,
  }
}

// Returns true only when env vars look like real Retell values (not placeholders).
// Prevents the AI Assistant button from appearing when keys are not yet configured.
export function isRetellConfigured(): boolean {
  const key = process.env['RETELL_API_KEY']?.trim()
  const agentId = process.env['RETELL_AGENT_ID']?.trim()
  return Boolean(key && agentId && key.startsWith('key_') && agentId.startsWith('agent_'))
}

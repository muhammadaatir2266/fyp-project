import Retell from 'retell-sdk'

let _client: Retell | null = null

function getClient(): Retell {
  if (!_client) {
    const apiKey = process.env.RETELL_API_KEY
    if (!apiKey) throw new Error('RETELL_API_KEY is not set')
    _client = new Retell({ apiKey })
  }
  return _client
}

export interface CreateWebCallOptions {
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  patientId: string
  patientName: string
  intentId: string
}

export async function createRetellWebCall(opts: CreateWebCallOptions) {
  const agentId = process.env.RETELL_AGENT_ID
  if (!agentId) throw new Error('RETELL_AGENT_ID is not set')

  const client = getClient()

  const response = await client.call.createWebCall({
    agent_id: agentId,
    metadata: {
      doctorId: opts.doctorId,
      patientId: opts.patientId,
      intentId: opts.intentId,
    },
    retell_llm_dynamic_variables: {
      patient_id: opts.patientId,
      intent_id: opts.intentId,
      doctor_id: opts.doctorId,
      patient_name: opts.patientName,
      doctor_name: opts.doctorName,
      doctor_specialty: opts.doctorSpecialty,
    },
  })

  return {
    accessToken: response.access_token,
    callId: response.call_id,
  }
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAppointments } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'get_appointments',
    'Look up a patient\'s appointments. Requires at least one patient identifier (patientId or patientPhone). Use upcoming=true to only show future PENDING/CONFIRMED appointments. Use this before cancelling to find the correct appointment ID.',
    {
      patientId: z
        .string()
        .optional()
        .describe('Patient ID from the DocLink system'),
      patientPhone: z
        .string()
        .optional()
        .describe('Patient phone number, e.g. "+923001234567"'),
      status: z
        .string()
        .optional()
        .describe('Filter by status: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW'),
      upcoming: z
        .boolean()
        .optional()
        .describe('If true, only returns future PENDING or CONFIRMED appointments'),
    },
    async (params) => {
      if (!params.patientId && !params.patientPhone) {
        return {
          content: [{ type: 'text', text: 'Please provide either patientId or patientPhone to look up appointments.' }],
          isError: true,
        }
      }

      try {
        const result = await getAppointments(params)

        if (!result.appointments || result.appointments.length === 0) {
          return {
            content: [{ type: 'text', text: 'No appointments found for this patient.' }],
          }
        }

        const lines = result.appointments.map((a) => {
          const dt = new Date(a.scheduledAt).toLocaleString('en-PK', {
            timeZone: 'Asia/Karachi',
            dateStyle: 'medium',
            timeStyle: 'short',
          })
          return `- ID: ${a.id} | ${a.doctor.name} (${a.doctor.specialty}) | ${dt} | Status: ${a.status}${a.reason ? ` | Reason: ${a.reason}` : ''}`
        })

        return {
          content: [
            {
              type: 'text',
              text: `Found ${result.count} appointment(s):\n${lines.join('\n')}`,
            },
          ],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error fetching appointments: ${err.message}` }],
          isError: true,
        }
      }
    },
  )
}

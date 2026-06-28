import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAvailableSlots } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'get_available_slots',
    'Get all available time slots for a doctor on a specific date. Use this when the patient has not specified a time, or after a time check fails, to offer them concrete choices.',
    {
      doctorId: z.string().describe('The doctor ID obtained from search_doctors'),
      date: z.string().describe('Date to check in YYYY-MM-DD format, e.g. "2026-07-01"'),
    },
    async ({ doctorId, date }) => {
      try {
        const result = await getAvailableSlots(doctorId, date)

        if (!result.slots || result.slots.length === 0) {
          const reason = result.message ?? 'No slots available'
          let text = `No available slots on ${date}: ${reason}`
          if (result.workingDays) {
            text += `\nDoctor works on: ${result.workingDays.join(', ')}`
          }
          return { content: [{ type: 'text', text }] }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Available slots for ${result.doctor?.name ?? 'this doctor'} on ${date}:\n${result.slots.join(', ')}\n\nAsk the patient which time they prefer.`,
            },
          ],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error fetching slots: ${err.message}` }],
          isError: true,
        }
      }
    },
  )
}

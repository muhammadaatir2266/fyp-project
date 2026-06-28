import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { checkAvailability } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'check_availability',
    'Check whether a specific doctor is available at a particular date and time. Returns availability status, and if unavailable, suggests alternative time slots for that day.',
    {
      doctorId: z.string().describe('The doctor ID obtained from search_doctors'),
      date: z.string().describe('Date to check in YYYY-MM-DD format, e.g. "2026-07-01"'),
      time: z.string().describe('Time to check in HH:MM 24-hour format, e.g. "10:00" or "14:30"'),
    },
    async ({ doctorId, date, time }) => {
      try {
        const result = await checkAvailability(doctorId, date, time)

        if (result.available) {
          return {
            content: [
              {
                type: 'text',
                text: `Dr. ${result.doctor?.name ?? 'the doctor'} is available on ${date} at ${time}. You can proceed to book this slot.`,
              },
            ],
          }
        }

        let text = `Not available: ${result.message}`
        if (result.suggestedTimes && result.suggestedTimes.length > 0) {
          text += `\nSuggested alternative times on ${date}: ${result.suggestedTimes.join(', ')}`
        }
        if (result.workingDays) {
          text += `\nDoctor's working days: ${result.workingDays.join(', ')}`
        }
        if (result.workingHours) {
          text += `\nWorking hours: ${result.workingHours.from}–${result.workingHours.to}`
        }

        return {
          content: [{ type: 'text', text }],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error checking availability: ${err.message}` }],
          isError: true,
        }
      }
    },
  )
}

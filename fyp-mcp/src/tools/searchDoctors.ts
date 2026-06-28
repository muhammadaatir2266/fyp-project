import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getDoctors } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'search_doctors',
    'Search for available doctors by medical specialty and/or city. Returns a list of doctors with their working hours, fees, and ratings. Use this to find doctors before checking availability or booking.',
    {
      specialty: z
        .string()
        .optional()
        .describe('Medical specialty to filter by, e.g. "Cardiology", "General Physician", "Dermatology"'),
      city: z
        .string()
        .optional()
        .describe('City to filter by, e.g. "Karachi", "Lahore", "Islamabad"'),
    },
    async ({ specialty, city }) => {
      try {
        const result = await getDoctors({ specialty, city })

        if (!result.doctors || result.doctors.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No doctors found${specialty ? ` for specialty "${specialty}"` : ''}${city ? ` in "${city}"` : ''}.`,
              },
            ],
          }
        }

        const summary = result.doctors
          .map(
            (d) =>
              `- ${d.name} | ${d.specialty} | ${d.city} | Fee: PKR ${d.consultationFee} | Rating: ${d.rating}/5 | Hours: ${d.workingHours.from}–${d.workingHours.to} | Days: ${d.workingDays.join(', ')} | ID: ${d.id}`,
          )
          .join('\n')

        return {
          content: [
            {
              type: 'text',
              text: `Found ${result.count} doctor(s):\n${summary}`,
            },
          ],
        }
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error searching doctors: ${err.message}` }],
          isError: true,
        }
      }
    },
  )
}

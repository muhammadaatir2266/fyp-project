import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { cancelAppointment } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'cancel_appointment',
    'Cancel an existing appointment by its ID. Only PENDING or CONFIRMED appointments can be cancelled. Use get_appointments first to find the correct appointment ID. This also removes the event from the doctor\'s Google Calendar if connected.',
    {
      appointmentId: z
        .string()
        .describe('The appointment ID to cancel (obtain from get_appointments or book_appointment)'),
    },
    async ({ appointmentId }) => {
      try {
        const result = await cancelAppointment(appointmentId)

        const scheduledLocal = new Date(result.appointment.scheduledAt).toLocaleString('en-PK', {
          timeZone: 'Asia/Karachi',
          dateStyle: 'full',
          timeStyle: 'short',
        })

        return {
          content: [
            {
              type: 'text',
              text: [
                `Appointment cancelled successfully.`,
                `Appointment ID: ${result.appointment.id}`,
                `Patient: ${result.appointment.patient.name}`,
                `Doctor: ${result.appointment.doctor.name}`,
                `Was scheduled for: ${scheduledLocal}`,
              ].join('\n'),
            },
          ],
        }
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to cancel appointment: ${err.message}`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

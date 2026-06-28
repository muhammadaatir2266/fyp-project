import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { bookAppointment } from '../lib/adminClient.js'

export function register(server: McpServer) {
  server.tool(
    'book_appointment',
    'Book an appointment for a patient with a doctor. At minimum provide doctorId, date, time, and one patient identifier (patientId, intentId, or patientName + patientPhone). Returns confirmation with the appointment ID and scheduled time.',
    {
      doctorId: z
        .string()
        .describe('The doctor ID obtained from search_doctors'),
      date: z
        .string()
        .describe('Appointment date in YYYY-MM-DD format, e.g. "2026-07-01"'),
      time: z
        .string()
        .describe('Appointment time in HH:MM 24-hour format, e.g. "10:00"'),
      patientId: z
        .string()
        .optional()
        .describe('Patient ID from the DocLink system (use when available for logged-in patients)'),
      intentId: z
        .string()
        .optional()
        .describe('Call booking intent ID (set by the web voice flow automatically)'),
      patientName: z
        .string()
        .optional()
        .describe('Full name of the patient, e.g. "Ahmed Khan" (used when patientId/intentId not available)'),
      patientPhone: z
        .string()
        .optional()
        .describe('Patient phone number, e.g. "+923001234567" (used for patient lookup or creation)'),
      patientEmail: z
        .string()
        .optional()
        .describe('Patient email address (used for lookup if phone not found)'),
      reason: z
        .string()
        .optional()
        .describe('Reason for the appointment, e.g. "Chest pain follow-up"'),
    },
    async (params) => {
      try {
        const result = await bookAppointment(params)
        const appt = result.appointment

        const scheduledLocal = new Date(appt.scheduledAt).toLocaleString('en-PK', {
          timeZone: 'Asia/Karachi',
          dateStyle: 'full',
          timeStyle: 'short',
        })

        return {
          content: [
            {
              type: 'text',
              text: [
                `Appointment booked successfully!`,
                `Appointment ID: ${appt.id}`,
                `Patient: ${appt.patient.name}`,
                `Doctor: ${appt.doctor.name} (${appt.doctor.specialty})`,
                `Scheduled: ${scheduledLocal}`,
                `Duration: ${appt.duration} minutes`,
                `Status: ${appt.status}`,
                `Reason: ${appt.reason}`,
              ].join('\n'),
            },
          ],
        }
      } catch (err: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to book appointment: ${err.message}. Please check the slot is still available and patient details are correct.`,
            },
          ],
          isError: true,
        }
      }
    },
  )
}

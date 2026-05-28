import { Router } from 'express'
import authMiddleware from '../middleware/auth'
import { getStats, getTodayAppointments, getRecentCalls } from '../controllers/dashboard.controller'
import { getAppointments, getAppointmentById, updateAppointment } from '../controllers/appointment.controller'
import {
  getPatients,
  getPatientById,
  getPatientSymptoms,
  getPatientPredictions,
  getPatientChatHistory,
  getPatientAppointments,
} from '../controllers/patient.controller'
import { getCalls, getCallById } from '../controllers/call.controller'
import {
  getAvailability,
  updateAvailability,
  getProfile,
  updateProfile,
  changePassword,
  updateNotificationSettings,
} from '../controllers/doctor.controller'

const router: Router = Router()

router.use(authMiddleware)

// Dashboard
router.get('/dashboard/stats', getStats)
router.get('/dashboard/appointments/today', getTodayAppointments)
router.get('/dashboard/calls/recent', getRecentCalls)

// Appointments
router.get('/appointments', getAppointments)
router.get('/appointments/:id', getAppointmentById)
router.put('/appointments/:id', updateAppointment)

// Patients
router.get('/patients', getPatients)
router.get('/patients/:id', getPatientById)
router.get('/patients/:id/symptoms', getPatientSymptoms)
router.get('/patients/:id/predictions', getPatientPredictions)
router.get('/patients/:id/chat-history', getPatientChatHistory)
router.get('/patients/:id/appointments', getPatientAppointments)

// Calls
router.get('/calls', getCalls)
router.get('/calls/:id', getCallById)

// Availability
router.get('/availability', getAvailability)
router.put('/availability', updateAvailability)

// Profile
router.get('/profile', getProfile)
router.put('/profile', updateProfile)

// Settings
router.put('/settings/password', changePassword)
router.put('/settings/notifications', updateNotificationSettings)

export default router

import { Router } from 'express'
import {
  getAppointments,
  bookAppointment,
  getAppointmentById,
  updateAppointment,
  createVoiceCall,
  createCallIntent,
} from '../controllers/appointments.controller'
import { authenticateToken, requireRole } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)
router.use(requireRole('PATIENT'))

router.get('/', getAppointments)
router.post('/', bookAppointment)
router.post('/voice-call', createVoiceCall)
router.post('/call-intent', createCallIntent) // backward compat alias
router.get('/:id', getAppointmentById)
router.patch('/:id', updateAppointment)

export default router

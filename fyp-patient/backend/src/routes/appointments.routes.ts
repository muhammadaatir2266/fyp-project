import { Router } from 'express'
import {
  getAppointments,
  bookAppointment,
  getAppointmentById,
  updateAppointment,
} from '../controllers/appointments.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)

router.get('/', getAppointments)
router.post('/', bookAppointment)
router.get('/:id', getAppointmentById)
router.patch('/:id', updateAppointment)

export default router

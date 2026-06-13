import { Router } from 'express'
import apiTokenMiddleware from '../middleware/apiToken'
import apiLoggerMiddleware from '../middleware/apiLogger'
import * as callingAgentController from '../controllers/callingAgent.controller'
import * as mlModelController from '../controllers/mlModel.controller'

const router: Router = Router()

router.use(apiTokenMiddleware)
router.use(apiLoggerMiddleware)

// Calling Agent API
router.get('/doctors', callingAgentController.getDoctors)
router.get('/doctors/:doctorId/availability', callingAgentController.checkDoctorAvailability)
router.get('/doctors/:doctorId/slots', callingAgentController.getAvailableSlots)
router.post('/doctors/:doctorId/appointments', callingAgentController.bookAppointment)

// ML Model API
router.post('/ml/predict', mlModelController.predictDisease)
router.get('/ml/symptoms', mlModelController.getSymptoms)
router.get('/ml/diseases', mlModelController.getDiseases)
router.get('/ml/health', mlModelController.checkHealth)

export default router

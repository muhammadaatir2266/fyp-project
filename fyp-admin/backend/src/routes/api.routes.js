const express = require('express');
const router = express.Router();
const apiTokenMiddleware = require('../middleware/apiToken');
const apiLoggerMiddleware = require('../middleware/apiLogger');
const callingAgentController = require('../controllers/callingAgent.controller');
const mlModelController = require('../controllers/mlModel.controller');

// All API routes require token authentication and logging
router.use(apiTokenMiddleware);
router.use(apiLoggerMiddleware);

// Calling Agent API endpoints
router.get('/doctors', callingAgentController.getDoctors);
router.get('/doctors/:doctorId/availability', callingAgentController.checkDoctorAvailability);
router.get('/doctors/:doctorId/slots', callingAgentController.getAvailableSlots);
router.post('/doctors/:doctorId/appointments', callingAgentController.bookAppointment);

// ML Model API endpoints
router.post('/ml/predict', mlModelController.predictDisease);
router.get('/ml/symptoms', mlModelController.getSymptoms);
router.get('/ml/diseases', mlModelController.getDiseases);
router.get('/ml/health', mlModelController.checkHealth);

module.exports = router;

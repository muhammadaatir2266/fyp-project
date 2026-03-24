const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const { getStats, getTodayAppointments, getRecentCalls } = require('../controllers/dashboard.controller');
const { getAppointments, getAppointmentById, updateAppointment } = require('../controllers/appointment.controller');
const {
  getPatients,
  getPatientById,
  getPatientSymptoms,
  getPatientPredictions,
  getPatientChatHistory,
  getPatientAppointments
} = require('../controllers/patient.controller');
const { getCalls, getCallById } = require('../controllers/call.controller');
const {
  getAvailability,
  updateAvailability,
  getProfile,
  updateProfile,
  changePassword,
  updateNotificationSettings
} = require('../controllers/doctor.controller');

router.use(authMiddleware);

// Dashboard
router.get('/dashboard/stats', getStats);
router.get('/dashboard/appointments/today', getTodayAppointments);
router.get('/dashboard/calls/recent', getRecentCalls);

// Appointments
router.get('/appointments', getAppointments);
router.get('/appointments/:id', getAppointmentById);
router.put('/appointments/:id', updateAppointment);

// Patients
router.get('/patients', getPatients);
router.get('/patients/:id', getPatientById);
router.get('/patients/:id/symptoms', getPatientSymptoms);
router.get('/patients/:id/predictions', getPatientPredictions);
router.get('/patients/:id/chat-history', getPatientChatHistory);
router.get('/patients/:id/appointments', getPatientAppointments);

// Calls
router.get('/calls', getCalls);
router.get('/calls/:id', getCallById);

// Availability
router.get('/availability', getAvailability);
router.put('/availability', updateAvailability);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Settings
router.put('/settings/password', changePassword);
router.put('/settings/notifications', updateNotificationSettings);

module.exports = router;

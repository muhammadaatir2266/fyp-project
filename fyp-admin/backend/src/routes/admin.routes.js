const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');
const doctorController = require('../controllers/doctor.controller');
const appointmentController = require('../controllers/appointment.controller');
const apiTokenController = require('../controllers/apiToken.controller');
const settingsController = require('../controllers/settings.controller');

// All admin routes require authentication
router.use(authMiddleware);

// Dashboard
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/recent-activity', dashboardController.getRecentActivity);

// Doctors
router.get('/doctors', doctorController.getDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.post('/doctors', doctorController.createDoctor);
router.put('/doctors/:id', doctorController.updateDoctor);
router.delete('/doctors/:id', doctorController.deleteDoctor);
router.patch('/doctors/:id/toggle-status', doctorController.toggleDoctorStatus);
router.post('/doctors/:id/approve', doctorController.approveDoctor);
router.post('/doctors/:id/reject', doctorController.rejectDoctor);
router.get('/doctors/:id/verification-document', doctorController.getVerificationDocument);

// Appointments
router.get('/appointments', appointmentController.getAppointments);
router.get('/appointments/:id', appointmentController.getAppointmentById);
router.put('/appointments/:id', appointmentController.updateAppointment);
router.delete('/appointments/:id', appointmentController.cancelAppointment);

// API Tokens
router.get('/api-tokens', apiTokenController.getApiTokens);
router.post('/api-tokens', apiTokenController.createApiToken);
router.delete('/api-tokens/:id', apiTokenController.revokeApiToken);
router.get('/api-tokens/:id/stats', apiTokenController.getApiTokenStats);

// API Logs
router.get('/api-logs', dashboardController.getApiLogs);

// Settings
router.get('/settings/profile', settingsController.getProfile);
router.put('/settings/profile', settingsController.updateProfile);
router.post('/settings/change-password', settingsController.changePassword);

module.exports = router;

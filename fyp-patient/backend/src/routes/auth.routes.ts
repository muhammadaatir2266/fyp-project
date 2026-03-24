import { Router, type IRouter } from 'express'
import * as authController from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router: IRouter = Router()

// Public routes
router.post('/login', authController.login)
router.post('/signup', authController.signup)
router.get('/specialties', authController.getSpecialties)

// Protected routes
router.get('/me', authenticateToken, authController.getMe)

export default router

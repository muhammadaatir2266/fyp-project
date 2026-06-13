import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import authMiddleware from '../middleware/auth'

const router: Router = Router()

router.post('/login', authController.login)
router.get('/profile', authMiddleware, authController.getProfile)

export default router

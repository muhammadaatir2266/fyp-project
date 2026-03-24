import { Router, type IRouter } from 'express'
import * as chatController from '../controllers/chat.controller'
import { authenticateToken, requireRole } from '../middleware/auth.middleware'

const router: IRouter = Router()

// Protected routes - only patients can send messages
router.post('/message', authenticateToken, requireRole('PATIENT'), chatController.sendMessage)

export default router

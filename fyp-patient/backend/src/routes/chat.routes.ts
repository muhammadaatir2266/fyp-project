import { Router, type IRouter } from 'express'
import * as chatController from '../controllers/chat.controller'
import { authenticateToken, requireRole } from '../middleware/auth.middleware'

const router: IRouter = Router()

router.post('/message', authenticateToken, requireRole('PATIENT'), chatController.sendMessage)
router.get('/sessions', authenticateToken, requireRole('PATIENT'), chatController.getChatSessions)

export default router

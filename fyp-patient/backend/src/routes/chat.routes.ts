import { Router, type IRouter } from 'express'
import * as chatController from '../controllers/chat.controller'
import { authenticateToken, requireRole } from '../middleware/auth.middleware'

const router: IRouter = Router()

// Public guest endpoints — no auth required
router.post('/guest/message', chatController.sendGuestMessage)
router.post('/guest/snapshot', chatController.saveGuestSnapshot)

// Authenticated patient endpoints
router.post('/guest/claim', authenticateToken, requireRole('PATIENT'), chatController.claimGuestSnapshot)
router.post('/message', authenticateToken, requireRole('PATIENT'), chatController.sendMessage)
router.get('/sessions', authenticateToken, requireRole('PATIENT'), chatController.getChatSessions)

export default router

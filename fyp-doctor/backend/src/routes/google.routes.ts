import { Router } from 'express'
import authMiddleware from '../middleware/auth'
import {
  connectGoogle,
  googleCallback,
  disconnectGoogle,
  googleStatus,
} from '../controllers/google.controller'

const router: Router = Router()

// Public: Google redirects the doctor's browser here (no app JWT on this request).
router.get('/callback', googleCallback)

// Authenticated doctor actions.
router.get('/connect', authMiddleware, connectGoogle)
router.get('/status', authMiddleware, googleStatus)
router.post('/disconnect', authMiddleware, disconnectGoogle)

export default router

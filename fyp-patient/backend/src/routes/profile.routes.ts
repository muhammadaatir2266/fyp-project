import { Router } from 'express'
import { getProfile, updateProfile, changePassword, getPrivacySettings, updatePrivacySettings, deleteChatSessions } from '../controllers/profile.controller'
import { authenticateToken, requireRole } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)
router.use(requireRole('PATIENT'))

router.get('/', getProfile)
router.put('/', updateProfile)
router.put('/password', changePassword)
router.get('/privacy', getPrivacySettings)
router.put('/privacy', updatePrivacySettings)
router.delete('/chat-sessions', deleteChatSessions)

export default router

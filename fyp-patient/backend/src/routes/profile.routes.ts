import { Router } from 'express'
import { getProfile, updateProfile, changePassword } from '../controllers/profile.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)

router.get('/', getProfile)
router.put('/', updateProfile)
router.put('/password', changePassword)

export default router

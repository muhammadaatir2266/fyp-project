import { Router } from 'express'
import { signup, login, getMe, getSpecialties, presignDocument } from '../controllers/auth.controller'
import authMiddleware from '../middleware/auth'

const router: Router = Router()

router.get('/specialties', getSpecialties)
router.post('/documents/presign', presignDocument)
router.post('/signup', signup)
router.post('/login', login)
router.get('/me', authMiddleware, getMe)

export default router

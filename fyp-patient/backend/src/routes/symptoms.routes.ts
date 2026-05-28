import { Router } from 'express'
import { getPatientSymptoms, getHistory } from '../controllers/symptoms.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)

router.get('/', getPatientSymptoms)
router.get('/history', getHistory)

export default router

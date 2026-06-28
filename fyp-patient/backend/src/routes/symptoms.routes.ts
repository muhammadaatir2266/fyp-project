import { Router } from 'express'
import { getPatientSymptoms, getHistory } from '../controllers/symptoms.controller'
import { authenticateToken, requireRole } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)
router.use(requireRole('PATIENT'))

router.get('/', getPatientSymptoms)
router.get('/history', getHistory)

export default router

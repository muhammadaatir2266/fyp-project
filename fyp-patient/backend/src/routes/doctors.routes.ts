import { Router } from 'express'
import { getDoctors, getDoctorById, getDoctorSlots } from '../controllers/doctors.controller'
import { getDoctorReviews } from '../controllers/reviews.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)

router.get('/', getDoctors)
router.get('/:id', getDoctorById)
router.get('/:id/slots', getDoctorSlots)
router.get('/:id/reviews', getDoctorReviews)

export default router

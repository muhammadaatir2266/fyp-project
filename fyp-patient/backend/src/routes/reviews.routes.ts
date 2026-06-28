import { Router } from 'express'
import { submitReview, getDoctorReviews } from '../controllers/reviews.controller'
import { authenticateToken, requireRole } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)
router.post('/', requireRole('PATIENT'), submitReview)  // only patients can submit reviews
router.get('/doctor/:id', getDoctorReviews)              // any authenticated user can view reviews

export default router

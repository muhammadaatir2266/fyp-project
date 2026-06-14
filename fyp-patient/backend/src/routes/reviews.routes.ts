import { Router } from 'express'
import { submitReview, getDoctorReviews } from '../controllers/reviews.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router: Router = Router()

router.use(authenticateToken)

router.post('/', submitReview)
router.get('/doctor/:id', getDoctorReviews)

export default router

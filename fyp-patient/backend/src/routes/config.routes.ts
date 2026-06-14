import { Router } from 'express'
import { getBookingConfig } from '../controllers/config.controller'

const router: Router = Router()

router.get('/booking', getBookingConfig)

export default router

import { Router } from 'express'
import { vapiWebhook, retellWebhook } from '../controllers/webhook.controller'

const router: Router = Router()

router.post('/vapi', vapiWebhook)
router.post('/retell', retellWebhook)

export default router

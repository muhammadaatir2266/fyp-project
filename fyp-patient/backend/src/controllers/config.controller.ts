import { Request, Response } from 'express'
import { isRetellConfigured } from '../lib/retell'

export const getBookingConfig = (_req: Request, res: Response) => {
  res.json({ callBookingEnabled: isRetellConfigured() })
}

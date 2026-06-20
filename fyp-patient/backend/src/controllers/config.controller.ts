import { Request, Response } from 'express'

export const getBookingConfig = (_req: Request, res: Response) => {
  const callBookingEnabled = Boolean(
    process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID,
  )
  res.json({ callBookingEnabled })
}

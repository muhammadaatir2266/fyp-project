import { Request, Response } from 'express'
import { getRetellConfigStatus } from '../lib/retell'

export const getBookingConfig = (_req: Request, res: Response) => {
  const retell = getRetellConfigStatus()
  res.json({
    callBookingEnabled: retell.configured,
    retell: {
      apiKeySet: retell.apiKeySet,
      agentIdSet: retell.agentIdSet,
      configured: retell.configured,
    },
  })
}

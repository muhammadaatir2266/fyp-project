import { Request, Response } from 'express'
import prisma from '../config/database'

export const getCalls = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!

    const calls = await prisma.callLog.findMany({
      where: { doctorId },
      orderBy: { startedAt: 'desc' },
    })

    res.json(calls)
  } catch (error) {
    console.error('Get calls error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getCallById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const doctorId = req.doctorId!

    const call = await prisma.callLog.findFirst({ where: { id, doctorId } })

    if (!call) {
      res.status(404).json({ message: 'Call not found' })
      return
    }

    res.json(call)
  } catch (error) {
    console.error('Get call error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

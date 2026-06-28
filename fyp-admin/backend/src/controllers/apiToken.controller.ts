import { Request, Response } from 'express'
import crypto from 'crypto'
import prisma from '../config/database'

const generateToken = (): string => crypto.randomBytes(32).toString('hex')
const hashToken = (raw: string): string => crypto.createHash('sha256').update(raw).digest('hex')

export const getApiTokens = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tokens = await prisma.apiToken.findMany({
      include: {
        admin: { select: { firstName: true, lastName: true } },
        _count: { select: { apiLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(tokens)
  } catch (error) {
    console.error('Get API tokens error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createApiToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, expiresInDays } = req.body as { name?: string; expiresInDays?: string | number }

    if (!name) {
      res.status(400).json({ message: 'Token name is required' })
      return
    }

    const token = generateToken()
    const tokenHash = hashToken(token)

    let expiresAt: Date | null = null
    if (expiresInDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(String(expiresInDays)))
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        name,
        token,       // retained for backward compat / display (consider removing in v2)
        tokenHash,   // secure lookup field
        adminId: req.adminId!,
        expiresAt,
      },
      include: { admin: { select: { firstName: true, lastName: true } } },
    })

    // Return the plaintext token only at creation time — it is never retrievable again.
    res.status(201).json({ ...apiToken, token })
  } catch (error) {
    console.error('Create API token error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const revokeApiToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const apiToken = await prisma.apiToken.update({
      where: { id },
      data: { isActive: false },
    })

    res.json({ message: 'API token revoked successfully', apiToken })
  } catch (error) {
    console.error('Revoke API token error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteApiToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    await prisma.apiToken.delete({ where: { id } })

    res.json({ message: 'API token deleted successfully' })
  } catch (error) {
    console.error('Delete API token error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getApiTokenStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const token = await prisma.apiToken.findUnique({
      where: { id },
      include: { _count: { select: { apiLogs: true } } },
    })

    if (!token) {
      res.status(404).json({ message: 'API token not found' })
      return
    }

    const usageByEndpoint = await prisma.apiLog.groupBy({
      by: ['endpoint'],
      where: { tokenId: id },
      _count: true,
      orderBy: { _count: { endpoint: 'desc' } },
    })

    const recentLogs = await prisma.apiLog.findMany({
      where: { tokenId: id },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ token, usageByEndpoint, recentLogs })
  } catch (error) {
    console.error('Get API token stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

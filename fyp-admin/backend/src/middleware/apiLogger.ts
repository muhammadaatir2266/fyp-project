import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'

const apiLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send.bind(res)
  let responseBody: string | undefined

  res.send = function (data: unknown): Response {
    responseBody = typeof data === 'string' ? data : JSON.stringify(data)
    return originalSend(data)
  }

  res.on('finish', async () => {
    try {
      if (req.tokenId) {
        await prisma.apiLog.create({
          data: {
            tokenId: req.tokenId,
            endpoint: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            requestBody: req.body ? JSON.stringify(req.body) : null,
            responseBody: responseBody ? responseBody.substring(0, 5000) : null,
            ipAddress: req.ip ?? (req.socket.remoteAddress ?? null),
            userAgent: req.headers['user-agent'] ?? null,
          },
        })
      }
    } catch (error) {
      console.error('API logging error:', error)
    }
  })

  next()
}

export default apiLoggerMiddleware

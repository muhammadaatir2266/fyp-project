import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error
  let statusCode = 500
  let message = 'Internal server error'

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409
      message = 'A record with this information already exists'
    } else if (err.code === 'P2025') {
      statusCode = 404
      message = 'Record not found'
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = err.message
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err)
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: 'Route not found' })
}

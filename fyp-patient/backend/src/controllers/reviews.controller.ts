import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error.middleware'

const submitSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(500).optional(),
})

async function recalculateRating(doctorId: string) {
  const agg = await prisma.doctorReview.aggregate({
    where: { doctorId },
    _avg: { rating: true },
    _count: { rating: true },
  })
  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count.rating,
    },
  })
}

export const submitReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId, rating, comment } = submitSchema.parse(req.body)

    if (!req.user) throw new AppError('Authentication required', 401)

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    })
    if (!patient) throw new AppError('Patient profile not found', 404)

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: patient.id },
      select: { id: true, status: true, doctorId: true },
    })
    if (!appointment) throw new AppError('Appointment not found', 404)
    if (appointment.status !== 'COMPLETED') {
      throw new AppError('You can only review a completed appointment', 400)
    }

    // One review per appointment (appointmentId is unique in schema)
    const existing = await prisma.doctorReview.findUnique({ where: { appointmentId } })
    if (existing) throw new AppError('You have already reviewed this appointment', 409)

    const review = await prisma.doctorReview.create({
      data: {
        appointmentId,
        patientId: patient.id,
        doctorId: appointment.doctorId,
        rating,
        comment: comment ?? null,
      },
    })

    await recalculateRating(appointment.doctorId)

    res.status(201).json({ success: true, review })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    next(error)
  }
}

export const getDoctorReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: doctorId } = req.params
    const page = Math.max(1, parseInt((req.query.page as string) || '1'))
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '10')))
    const skip = (page - 1) * limit

    const [reviews, total, agg] = await Promise.all([
      prisma.doctorReview.findMany({
        where: { doctorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          patient: { select: { firstName: true } },
        },
      }),
      prisma.doctorReview.count({ where: { doctorId } }),
      prisma.doctorReview.aggregate({ where: { doctorId }, _avg: { rating: true } }),
    ])

    const formatted = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      patientInitial: r.patient.firstName.charAt(0).toUpperCase() + '.',
    }))

    res.json({
      reviews: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
    })
  } catch (error) {
    next(error)
  }
}

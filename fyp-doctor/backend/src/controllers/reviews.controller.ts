import { Request, Response } from 'express'
import prisma from '../config/database'

export const getMyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.doctorId!
    const page = Math.max(1, parseInt((req.query.page as string) || '1'))
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '10')))
    const skip = (page - 1) * limit

    const [reviews, total, agg] = await Promise.all([
      prisma.doctorReview.findMany({
        where: { doctorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { patient: { select: { firstName: true } } },
      }),
      prisma.doctorReview.count({ where: { doctorId } }),
      prisma.doctorReview.aggregate({
        where: { doctorId },
        _avg: { rating: true },
      }),
    ])

    res.json({
      avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        patientInitial: r.patient.firstName.charAt(0).toUpperCase() + '.',
      })),
    })
  } catch (error) {
    console.error('Get my reviews error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

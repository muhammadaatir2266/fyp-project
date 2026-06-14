import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { haversineKm } from '../lib/geocode'

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const {
      specialty, city, name, minRating,
      lat, lng, radiusKm = '25',
      page = '1', limit = '20',
    } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const patLat = lat ? parseFloat(lat) : null
    const patLng = lng ? parseFloat(lng) : null
    const radius = Math.min(100, Math.max(1, parseFloat(radiusKm)))
    const nearbyMode = patLat !== null && patLng !== null && !isNaN(patLat) && !isNaN(patLng)

    const where: any = {
      isActive: true,
      isVerified: true,
      verificationStatus: 'APPROVED',
    }

    if (specialty) {
      where.specialty = { name: { contains: specialty, mode: 'insensitive' } }
    }
    // In nearby mode we skip the city text filter; distance is the filter
    if (city && !nearbyMode) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (name) {
      where.OR = [
        { firstName: { contains: name, mode: 'insensitive' } },
        { lastName: { contains: name, mode: 'insensitive' } },
      ]
    }

    // Compute global average rating for Bayesian weighting
    const globalAgg = await prisma.doctorReview.aggregate({ _avg: { rating: true } })
    const globalAvg = globalAgg._avg.rating ?? 3.5

    // In nearby mode we fetch all approved doctors (no pagination yet — filter by distance first)
    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          specialty: true,
          _count: {
            select: {
              appointments: { where: { status: 'COMPLETED' } },
            },
          },
        },
        // Skip DB pagination in nearby mode so we can distance-filter first
        ...(nearbyMode ? {} : { skip, take: limitNum }),
      }),
      prisma.doctor.count({ where }),
    ])

    // Annotate each doctor with trust signals + optional distance
    type Annotated = {
      doc: (typeof doctors)[number]
      isPlatformVerified: boolean
      completedAppointmentsCount: number
      weighted: number
      distanceKm?: number
    }

    let annotated: Annotated[] = doctors.map((doc) => {
      const isPlatformVerified =
        doc.verificationStatus === 'APPROVED' && doc.isVerified && doc.verifiedAt !== null
      const completedAppointmentsCount = doc._count.appointments
      const weighted = (doc.reviewCount * doc.rating + 3 * globalAvg) / (doc.reviewCount + 3)
      const distanceKm =
        nearbyMode && doc.latitude != null && doc.longitude != null
          ? Math.round(haversineKm(patLat!, patLng!, doc.latitude, doc.longitude) * 10) / 10
          : undefined
      return { doc, isPlatformVerified, completedAppointmentsCount, weighted, distanceKm }
    })

    // In nearby mode: filter by radius (doctors without coords are excluded)
    if (nearbyMode) {
      annotated = annotated.filter(
        ({ distanceKm }) => distanceKm !== undefined && distanceKm <= radius
      )
    }

    // minRating filter
    if (minRating) {
      const min = parseFloat(minRating)
      annotated = annotated.filter(({ weighted }) => weighted >= min)
    }

    // Sort
    annotated.sort((a, b) => {
      // 1. Nearest first when in nearby mode
      if (nearbyMode && a.distanceKm !== undefined && b.distanceKm !== undefined) {
        if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) return a.distanceKm - b.distanceKm
      }
      // 2. Platform verified first
      if (a.isPlatformVerified !== b.isPlatformVerified) return a.isPlatformVerified ? -1 : 1
      // 3. Bayesian weighted rating
      if (Math.abs(a.weighted - b.weighted) > 0.01) return b.weighted - a.weighted
      // 4. Review count
      if (a.doc.reviewCount !== b.doc.reviewCount) return b.doc.reviewCount - a.doc.reviewCount
      // 5. Completed appointments
      if (a.completedAppointmentsCount !== b.completedAppointmentsCount) {
        return b.completedAppointmentsCount - a.completedAppointmentsCount
      }
      // 6. Experience
      return b.doc.experience - a.doc.experience
    })

    // Apply pagination after distance-filtering in nearby mode
    const paginatedTotal = nearbyMode ? annotated.length : total
    const paginated = nearbyMode ? annotated.slice(skip, skip + limitNum) : annotated

    res.json({
      doctors: paginated.map(({ doc, isPlatformVerified, completedAppointmentsCount, distanceKm }) =>
        formatDoctor(doc, isPlatformVerified, completedAppointmentsCount, distanceKm)
      ),
      total: paginatedTotal,
      page: pageNum,
      totalPages: Math.ceil(paginatedTotal / limitNum),
      nearbyMode,
    })
  } catch (error) {
    console.error('Get doctors error:', error)
    res.status(500).json({ error: 'Failed to fetch doctors' })
  }
}

export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const doctor = await prisma.doctor.findFirst({
      where: { id, isActive: true, isVerified: true },
      include: {
        specialty: true,
        _count: { select: { appointments: { where: { status: 'COMPLETED' } } } },
      },
    })

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' })
    }

    const isPlatformVerified =
      doctor.verificationStatus === 'APPROVED' && doctor.isVerified && doctor.verifiedAt !== null

    const recentReviews = await prisma.doctorReview.findMany({
      where: { doctorId: id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { patient: { select: { firstName: true } } },
    })

    res.json({
      ...formatDoctor(doctor, isPlatformVerified, doctor._count.appointments),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        patientInitial: r.patient.firstName.charAt(0).toUpperCase() + '.',
      })),
    })
  } catch (error) {
    console.error('Get doctor error:', error)
    res.status(500).json({ error: 'Failed to fetch doctor' })
  }
}

export const getDoctorSlots = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { date } = req.query as { date?: string }

    if (!date) {
      return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD)' })
    }

    const doctor = await prisma.doctor.findFirst({
      where: { id, isActive: true },
    })

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' })
    }

    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' })

    if (!doctor.workingDays.includes(dayOfWeek)) {
      return res.json({ date, slots: [], reason: 'Doctor does not work on this day' })
    }

    if (doctor.unavailableDates?.includes(date)) {
      return res.json({ date, slots: [], reason: 'Doctor is unavailable on this date' })
    }

    const fromHour = parseInt((doctor.availableFrom || '09:00').split(':')[0])
    const toHour = parseInt((doctor.availableTo || '17:00').split(':')[0])

    const allSlots: string[] = []
    for (let h = fromHour; h < toHour; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00`)
      allSlots.push(`${String(h).padStart(2, '0')}:30`)
    }

    const booked = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        scheduledAt: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { scheduledAt: true },
    })

    const bookedTimes = new Set(booked.map(a => {
      const d = new Date(a.scheduledAt)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }))

    const available = allSlots.filter(s => !bookedTimes.has(s))

    res.json({ date, slots: available })
  } catch (error) {
    console.error('Get doctor slots error:', error)
    res.status(500).json({ error: 'Failed to fetch slots' })
  }
}

function formatDoctor(
  doctor: any,
  isPlatformVerified: boolean,
  completedAppointmentsCount: number,
  distanceKm?: number,
) {
  return {
    id: doctor.id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    fullName: `${doctor.firstName} ${doctor.lastName}`,
    specialty: doctor.specialty,
    phone: doctor.phone,
    address: doctor.address,
    city: doctor.city,
    clinicLocation: doctor.clinicLocation,
    latitude: doctor.latitude,
    longitude: doctor.longitude,
    qualifications: doctor.qualifications,
    experience: doctor.experience,
    rating: doctor.rating,
    reviewCount: doctor.reviewCount,
    consultationFee: doctor.consultationFee,
    availableFrom: doctor.availableFrom,
    availableTo: doctor.availableTo,
    workingDays: doctor.workingDays,
    isPlatformVerified,
    completedAppointmentsCount,
    ...(distanceKm !== undefined && { distanceKm }),
  }
}

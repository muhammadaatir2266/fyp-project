import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { haversineKm } from '../lib/geocode'
import { findSoonestSlot, buildBookedMap, generateDaySlots, civilDateKey, civilSlotLabel, civilSlotToDate, civilDayBounds, civilWeekday } from '../lib/availability'
import { batchDoctorMetrics } from '../lib/doctorMetrics'
import { resolveSpecialty } from '../lib/specialty'
import { getBusyIntervals, blockBusyIntoBookedTimes } from '../lib/google-calendar'

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const {
      specialty, specialtyId, city, name, minRating,
      lat, lng, radiusKm = '25',
      maxFee, gender, language, available48h, sortBy = 'recommended',
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

    // Prefer explicit UUID specialtyId; fall back to resolving by canonical name/alias
    if (specialtyId) {
      where.specialtyId = specialtyId
    } else if (specialty) {
      const resolved = await resolveSpecialty(specialty)
      if (resolved) {
        where.specialtyId = resolved.id
      } else {
        // No match → return empty result set rather than unfiltered list
        return res.json({ doctors: [], total: 0, page: 1, totalPages: 0 })
      }
    }

    if (city && !nearbyMode) where.city = { contains: city, mode: 'insensitive' }
    if (name) {
      where.OR = [
        { firstName: { contains: name, mode: 'insensitive' } },
        { lastName: { contains: name, mode: 'insensitive' } },
      ]
    }
    if (maxFee) where.consultationFee = { lte: parseFloat(maxFee) }
    if (gender) where.gender = gender.toUpperCase()
    if (language) where.languages = { has: language }

    // Compute global average rating for Bayesian weighting
    const globalAgg = await prisma.doctorReview.aggregate({ _avg: { rating: true } })
    const globalAvg = globalAgg._avg.rating ?? 3.5

    // Fetch all when we need to post-filter by distance or availability
    const needsPostFilter = nearbyMode || available48h === 'true'

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          specialty: true,
          _count: { select: { appointments: { where: { status: 'COMPLETED' } } } },
        },
        ...(needsPostFilter ? {} : { skip, take: limitNum }),
      }),
      prisma.doctor.count({ where }),
    ])

    const doctorIds = doctors.map((d) => d.id)

    // Batch: fetch upcoming appointments for soonest-slot computation
    const now = new Date()
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcomingAppts = await prisma.appointment.findMany({
      where: {
        doctorId: { in: doctorIds },
        scheduledAt: { gte: now, lte: sevenDaysOut },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { doctorId: true, scheduledAt: true },
    })

    // Group upcoming booked times by doctor
    const bookedByDoctor = new Map<string, Date[]>()
    for (const a of upcomingAppts) {
      if (!bookedByDoctor.has(a.doctorId)) bookedByDoctor.set(a.doctorId, [])
      bookedByDoctor.get(a.doctorId)!.push(a.scheduledAt)
    }

    // Batch doctor metrics (recency rating, reliability)
    const metricsMap = await batchDoctorMetrics(doctorIds, globalAvg)

    type Annotated = {
      doc: (typeof doctors)[number]
      isPlatformVerified: boolean
      completedAppointmentsCount: number
      weighted: number
      distanceKm?: number
      nextAvailableAt: Date | null
      hasSlotWithin48h: boolean
      recencyRating: number | null
      lastReviewAt: Date | null
      reliabilityScore: number | null
      doctorCancellationRate: number | null
      avgConfirmHours: number | null
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

      const bookedMap = buildBookedMap(bookedByDoctor.get(doc.id) ?? [])
      const avail = findSoonestSlot(doc, bookedMap, now, 7)

      const metrics = metricsMap.get(doc.id)

      return {
        doc,
        isPlatformVerified,
        completedAppointmentsCount,
        weighted,
        distanceKm,
        nextAvailableAt: avail.nextAvailableAt,
        hasSlotWithin48h: avail.hasSlotWithin48h,
        recencyRating: metrics?.recencyRating ?? null,
        lastReviewAt: metrics?.lastReviewAt ?? null,
        reliabilityScore: metrics?.reliabilityScore ?? null,
        doctorCancellationRate: metrics?.doctorCancellationRate ?? null,
        avgConfirmHours: metrics?.avgConfirmHours ?? null,
      }
    })

    // Post-filters
    if (nearbyMode) {
      annotated = annotated.filter(
        ({ distanceKm }) => distanceKm !== undefined && distanceKm <= radius,
      )
    }
    if (available48h === 'true') {
      annotated = annotated.filter(({ hasSlotWithin48h }) => hasSlotWithin48h)
    }
    if (minRating) {
      const min = parseFloat(minRating)
      annotated = annotated.filter(({ weighted }) => weighted >= min)
    }

    // Sort
    annotated.sort((a, b) => {
      if (sortBy === 'fee_asc') {
        const fa = a.doc.consultationFee ?? Infinity
        const fb = b.doc.consultationFee ?? Infinity
        if (nearbyMode && a.distanceKm !== undefined && b.distanceKm !== undefined) {
          if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) return a.distanceKm - b.distanceKm
        }
        return fa - fb
      }

      if (sortBy === 'soonest') {
        if (nearbyMode && a.distanceKm !== undefined && b.distanceKm !== undefined) {
          if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) return a.distanceKm - b.distanceKm
        }
        const ta = a.nextAvailableAt?.getTime() ?? Infinity
        const tb = b.nextAvailableAt?.getTime() ?? Infinity
        return ta - tb
      }

      if (sortBy === 'rating') {
        if (nearbyMode && a.distanceKm !== undefined && b.distanceKm !== undefined) {
          if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) return a.distanceKm - b.distanceKm
        }
        const ra = a.recencyRating ?? a.weighted
        const rb = b.recencyRating ?? b.weighted
        return rb - ra
      }

      // Default: recommended
      if (nearbyMode && a.distanceKm !== undefined && b.distanceKm !== undefined) {
        if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) return a.distanceKm - b.distanceKm
      }
      // Has slot within 48h
      if (a.hasSlotWithin48h !== b.hasSlotWithin48h) return a.hasSlotWithin48h ? -1 : 1
      // Soonest slot
      const ta = a.nextAvailableAt?.getTime() ?? Infinity
      const tb = b.nextAvailableAt?.getTime() ?? Infinity
      if (ta !== tb) return ta - tb
      // Platform verified
      if (a.isPlatformVerified !== b.isPlatformVerified) return a.isPlatformVerified ? -1 : 1
      // Recency rating
      const ra = a.recencyRating ?? a.weighted
      const rb = b.recencyRating ?? b.weighted
      if (Math.abs(ra - rb) > 0.05) return rb - ra
      // Reliability
      const rsa = a.reliabilityScore ?? 50
      const rsb = b.reliabilityScore ?? 50
      if (rsa !== rsb) return rsb - rsa
      // Review count
      if (a.doc.reviewCount !== b.doc.reviewCount) return b.doc.reviewCount - a.doc.reviewCount
      // Completed appointments
      if (a.completedAppointmentsCount !== b.completedAppointmentsCount) {
        return b.completedAppointmentsCount - a.completedAppointmentsCount
      }
      return b.doc.experience - a.doc.experience
    })

    const paginatedTotal = needsPostFilter ? annotated.length : total
    const paginated = needsPostFilter ? annotated.slice(skip, skip + limitNum) : annotated

    res.json({
      doctors: paginated.map((a) =>
        formatDoctor(a.doc, a.isPlatformVerified, a.completedAppointmentsCount, {
          distanceKm: a.distanceKm,
          nextAvailableAt: a.nextAvailableAt,
          hasSlotWithin48h: a.hasSlotWithin48h,
          recencyRating: a.recencyRating,
          lastReviewAt: a.lastReviewAt,
          reliabilityScore: a.reliabilityScore,
          doctorCancellationRate: a.doctorCancellationRate,
          avgConfirmHours: a.avgConfirmHours,
        })
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
      ...formatDoctor(doctor, isPlatformVerified, doctor._count.appointments, {}),
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

    // Past dates have no bookable slots.
    if (date < civilDateKey(new Date())) {
      return res.json({ date, slots: [], reason: 'Cannot book appointments in the past' })
    }

    // Query appointments using civil day bounds in APPOINTMENT_TZ so the range
    // is correct regardless of the server's system timezone.
    const { start: dayStart, end: dayEnd } = civilDayBounds(date)

    const booked = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { scheduledAt: true },
    })

    // Build booked-times set using civil slot labels so "10:00 PKT" booked
    // appointment is stored as "10:00", not the UTC hour.
    const bookedTimes = new Set(booked.map((a) => civilSlotLabel(new Date(a.scheduledAt))))

    // Use civil noon as a stable representative Date for weekday/dateStr lookups.
    const requestedDate = civilSlotToDate(date, '12:00')

    // Subtract the doctor's external Google Calendar busy times (fail-open).
    const busy = await getBusyIntervals(doctor, dayStart, dayEnd)
    blockBusyIntoBookedTimes(date, busy, bookedTimes)

    const slots = generateDaySlots(doctor, requestedDate, bookedTimes)

    if (slots.length === 0 && !doctor.workingDays.includes(civilWeekday(requestedDate))) {
      return res.json({ date, slots: [], reason: 'Doctor does not work on this day' })
    }
    if (slots.length === 0 && doctor.unavailableDates?.includes(date)) {
      return res.json({ date, slots: [], reason: 'Doctor is unavailable on this date' })
    }

    res.json({ date, slots })
  } catch (error) {
    console.error('Get doctor slots error:', error)
    res.status(500).json({ error: 'Failed to fetch slots' })
  }
}

interface ExtraFields {
  distanceKm?: number
  nextAvailableAt?: Date | null
  hasSlotWithin48h?: boolean
  recencyRating?: number | null
  lastReviewAt?: Date | null
  reliabilityScore?: number | null
  doctorCancellationRate?: number | null
  avgConfirmHours?: number | null
}

function formatDoctor(
  doctor: any,
  isPlatformVerified: boolean,
  completedAppointmentsCount: number,
  extra: ExtraFields = {},
) {
  return {
    id: doctor.id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    fullName: `${doctor.firstName} ${doctor.lastName}`,
    specialty: doctor.specialty,
    gender: doctor.gender,
    languages: doctor.languages ?? [],
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
    ...(extra.distanceKm !== undefined && { distanceKm: extra.distanceKm }),
    nextAvailableAt: extra.nextAvailableAt ?? null,
    hasSlotWithin48h: extra.hasSlotWithin48h ?? false,
    recencyRating: extra.recencyRating ?? null,
    lastReviewAt: extra.lastReviewAt ?? null,
    reliabilityScore: extra.reliabilityScore ?? null,
    doctorCancellationRate: extra.doctorCancellationRate ?? null,
    avgConfirmHours: extra.avgConfirmHours ?? null,
  }
}

import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const { specialty, city, name, page = '1', limit = '20' } = req.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const where: any = {
      isActive: true,
      isVerified: true,
      verificationStatus: 'APPROVED',
    }

    if (specialty) {
      where.specialty = { name: { contains: specialty, mode: 'insensitive' } }
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (name) {
      where.OR = [
        { firstName: { contains: name, mode: 'insensitive' } },
        { lastName: { contains: name, mode: 'insensitive' } },
      ]
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: { specialty: true },
        orderBy: [{ rating: 'desc' }, { experience: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.doctor.count({ where }),
    ])

    res.json({
      doctors: doctors.map(formatDoctor),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
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
      include: { specialty: true },
    })

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' })
    }

    res.json(formatDoctor(doctor))
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

    // Build 30-minute slots
    const allSlots: string[] = []
    for (let h = fromHour; h < toHour; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00`)
      allSlots.push(`${String(h).padStart(2, '0')}:30`)
    }

    // Remove already-booked slots
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

function formatDoctor(doctor: any) {
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
  }
}

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import {
  getBusyIntervals,
  createCalendarEvent,
  type GoogleDoctor,
  type BusyInterval,
} from '../lib/google-calendar'

const SLOT_MINUTES = 30
const pad = (n: number) => String(n).padStart(2, '0')

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function slotStartAt(dateStr: string, slot: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = slot.split(':').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setHours(h, min, 0, 0)
  return dt
}

function earliestBookableAt(minAdvanceSlots: number, now: Date = new Date()): Date {
  const slots = Math.max(0, minAdvanceSlots ?? 0)
  const earliest = new Date(now.getTime() + slots * SLOT_MINUTES * 60_000)
  const minutes = earliest.getMinutes()
  const remainder = minutes % SLOT_MINUTES
  if (remainder !== 0 || earliest.getSeconds() > 0 || earliest.getMilliseconds() > 0) {
    earliest.setMinutes(minutes + (SLOT_MINUTES - remainder), 0, 0)
  } else {
    earliest.setSeconds(0, 0)
  }
  return earliest
}

function isSlotTooSoon(dateStr: string, slot: string, minAdvanceSlots: number, now: Date = new Date()): boolean {
  const todayKey = localDateKey(now)
  if (dateStr < todayKey) return true
  if (dateStr > todayKey) return false
  return slotStartAt(dateStr, slot) < earliestBookableAt(minAdvanceSlots, now)
}

function filterBookableSlots(dateStr: string, slots: string[], minAdvanceSlots: number, now: Date = new Date()): string[] {
  const todayKey = localDateKey(now)
  if (dateStr < todayKey) return []
  if (dateStr > todayKey) return slots
  return slots.filter((slot) => !isSlotTooSoon(dateStr, slot, minAdvanceSlots, now))
}

/**
 * Reads the per-date slot override for a date, if any. Returns the array of
 * "HH:MM" available slots (possibly empty) when the date has an explicit
 * override, or null when no override exists for that date.
 */
function getDateOverride(slotOverrides: unknown, dateStr: string): string[] | null {
  if (!slotOverrides || typeof slotOverrides !== 'object') return null
  const map = slotOverrides as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(map, dateStr)) return null
  const v = map[dateStr]
  if (!Array.isArray(v)) return null
  return v.filter((x): x is string => typeof x === 'string')
}

async function getSuggestedTimeSlots(
  doctorId: string,
  date: string,
  availableFrom: string,
  availableTo: string,
  googleDoctor?: GoogleDoctor,
  slotOverrides?: unknown,
  minAdvanceSlots = 2,
): Promise<string[]> {
  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59`)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { scheduledAt: true, duration: true },
  })

  // External Google busy times block slots too (fail-open: [] when not connected).
  const busy: BusyInterval[] = googleDoctor
    ? await getBusyIntervals(googleDoctor, dayStart, dayEnd)
    : []

  // Candidate slots: a per-date override fully replaces the weekly default.
  const override = getDateOverride(slotOverrides, date)
  let candidateTimes: string[]
  if (override) {
    candidateTimes = [...override].sort()
  } else {
    const startHour = parseInt(availableFrom.split(':')[0])
    const startMinute = parseInt(availableFrom.split(':')[1])
    const endHour = parseInt(availableTo.split(':')[0])
    candidateTimes = []
    for (let hour = startHour; hour < endHour; hour++) {
      for (const minute of [0, 30]) {
        if (hour === startHour && minute < startMinute) continue
        candidateTimes.push(
          `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        )
      }
    }
  }

  const slots: string[] = []
  for (const timeString of candidateTimes) {
    const slotStart = new Date(`${date}T${timeString}`)
    const slotEnd = new Date(slotStart.getTime() + 30 * 60000)

    const hasConflict = existingAppointments.some((apt: { scheduledAt: Date; duration: number }) => {
      const aptStart = new Date(apt.scheduledAt)
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000)
      return slotStart < aptEnd && slotEnd > aptStart
    })

    const hasBusyConflict = busy.some((b) => slotStart < b.end && slotEnd > b.start)

    if (!hasConflict && !hasBusyConflict) slots.push(timeString)
  }

  return filterBookableSlots(date, slots, minAdvanceSlots).slice(0, 10)
}

export const checkDoctorAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.params.doctorId as string
    const { date, time } = req.query as { date?: string; time?: string }

    if (!date || !time) {
      res.status(400).json({
        success: false,
        message: 'Date and time are required',
        example: '/api/v1/doctors/{doctorId}/availability?date=2024-03-15&time=14:30',
      })
      return
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true, firstName: true, lastName: true,
        availableFrom: true, availableTo: true,
        workingDays: true, unavailableDates: true, isActive: true, slotOverrides: true, minAdvanceSlots: true,
        googleCalendarConnected: true, googleRefreshToken: true, googleCalendarId: true,
        specialty: { select: { name: true } },
      },
    })

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' })
      return
    }

    if (!doctor.isActive) {
      res.status(400).json({ success: false, message: 'Doctor is not currently accepting appointments' })
      return
    }

    const requestedDate = new Date(date)
    const requestedDateTime = new Date(`${date}T${time}`)
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' })

    if (requestedDateTime < new Date()) {
      res.json({
        success: false, available: false,
        message: 'Cannot book appointments in the past',
        doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
      })
      return
    }

    const availableFrom = doctor.availableFrom ?? '09:00'
    const availableTo = doctor.availableTo ?? '17:00'
    const minAdvance = doctor.minAdvanceSlots ?? 2

    if (isSlotTooSoon(date, time, minAdvance)) {
      res.json({
        success: false, available: false,
        message:
          minAdvance === 0
            ? 'This time slot has already passed'
            : `Same-day bookings require at least ${minAdvance} slot(s) (${minAdvance * 30} min) advance notice`,
        doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
        suggestedTimes: await getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo, doctor, doctor.slotOverrides, minAdvance),
      })
      return
    }

    const override = getDateOverride(doctor.slotOverrides, date)

    if (override) {
      // A per-date override fully replaces working days/hours for that date.
      if (!override.includes(time)) {
        res.json({
          success: false, available: false,
          message: 'Requested time is not available on this date',
          doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
          suggestedTimes: await getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo, doctor, doctor.slotOverrides, minAdvance),
        })
        return
      }
    } else {
      if (doctor.unavailableDates?.some((d) => new Date(d).toDateString() === requestedDate.toDateString())) {
        res.json({
          success: false, available: false,
          message: 'Doctor is not available on this date',
          doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
        })
        return
      }

      if (!doctor.workingDays?.includes(dayOfWeek)) {
        res.json({
          success: false, available: false,
          message: `Doctor does not work on ${dayOfWeek}`,
          doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
          workingDays: doctor.workingDays ?? [],
        })
        return
      }

      if (time < availableFrom || time >= availableTo) {
        res.json({
          success: false, available: false,
          message: "Requested time is outside doctor's working hours",
          doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
          workingHours: { from: availableFrom, to: availableTo },
        })
        return
      }
    }

    const startTime = new Date(requestedDateTime)
    const endTime = new Date(startTime.getTime() + 30 * 60000)
    const dayStart = new Date(`${date}T00:00:00`)
    const dayEnd = new Date(`${date}T23:59:59`)

    const existingAppointments = await prisma.appointment.findMany({
      where: { doctorId, scheduledAt: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { scheduledAt: true, duration: true },
    })

    // External Google busy times also make a slot unavailable (fail-open).
    const busy = await getBusyIntervals(doctor, dayStart, dayEnd)

    const hasConflict =
      existingAppointments.some((apt) => {
        const aptStart = new Date(apt.scheduledAt)
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000)
        return startTime < aptEnd && endTime > aptStart
      }) || busy.some((b) => startTime < b.end && endTime > b.start)

    if (hasConflict) {
      res.json({
        success: false, available: false,
        message: 'This time slot is already booked',
        doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
        suggestedTimes: await getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo, doctor, doctor.slotOverrides, minAdvance),
      })
      return
    }

    res.json({
      success: true, available: true,
      message: 'Time slot is available',
      doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
      slot: { date, time, duration: 30 },
    })
  } catch (error) {
    console.error('Check availability error:', error)
    res.status(500).json({ success: false, message: 'Server error while checking availability' })
  }
}

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.params.doctorId as string
    const { date } = req.query as { date?: string }

    if (!date) {
      res.status(400).json({ success: false, message: 'Date is required' })
      return
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true, firstName: true, lastName: true,
        availableFrom: true, availableTo: true,
        workingDays: true, unavailableDates: true, isActive: true, slotOverrides: true, minAdvanceSlots: true,
        googleCalendarConnected: true, googleRefreshToken: true, googleCalendarId: true,
        specialty: { select: { name: true } },
      },
    })

    if (!doctor || !doctor.isActive) {
      res.status(404).json({ success: false, message: 'Doctor not found or not active' })
      return
    }

    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' })
    const availableFrom = doctor.availableFrom ?? '09:00'
    const availableTo = doctor.availableTo ?? '17:00'
    const override = getDateOverride(doctor.slotOverrides, date)

    // A per-date override fully replaces working days/hours for that date.
    if (!override) {
      if (doctor.unavailableDates?.some((d) => new Date(d).toDateString() === requestedDate.toDateString())) {
        res.json({ success: true, available: false, message: 'Doctor is not available on this date', slots: [] })
        return
      }

      if (!doctor.workingDays?.includes(dayOfWeek)) {
        res.json({
          success: true, available: false,
          message: `Doctor does not work on ${dayOfWeek}`,
          slots: [], workingDays: doctor.workingDays ?? [],
        })
        return
      }
    }

    const slots = await getSuggestedTimeSlots(
      doctorId,
      date,
      availableFrom,
      availableTo,
      doctor,
      doctor.slotOverrides,
      doctor.minAdvanceSlots ?? 2,
    )

    res.json({
      success: true,
      doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
      date,
      slots,
    })
  } catch (error) {
    console.error('Get available slots error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching available slots' })
  }
}

export const bookAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.params.doctorId as string
    const {
      patientId: rawPatientId,
      intentId,
      patientName,
      patientPhone,
      patientEmail,
      date,
      time,
      reason,
      duration = 30,
    } = req.body as {
      patientId?: string
      intentId?: string
      patientName?: string
      patientPhone?: string
      patientEmail?: string
      date?: string
      time?: string
      reason?: string
      duration?: number | string
    }

    if (!date || !time) {
      res.status(400).json({ success: false, message: 'Missing required fields: date, time' })
      return
    }

    // At least one patient identifier must be present
    const hasIdentifier = rawPatientId || intentId || (patientName && patientPhone)
    if (!hasIdentifier) {
      res.status(400).json({
        success: false,
        message: 'Provide patientId, intentId, or both patientName + patientPhone',
      })
      return
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true, firstName: true, lastName: true, isActive: true,
        googleCalendarConnected: true, googleRefreshToken: true, googleCalendarId: true,
      },
    })

    if (!doctor || !doctor.isActive) {
      res.status(404).json({ success: false, message: 'Doctor not found or not active' })
      return
    }

    let patient = null

    // Priority 1: direct patientId (web voice — logged-in patient)
    if (rawPatientId) {
      patient = await prisma.patient.findUnique({ where: { id: rawPatientId } })
    }

    // Priority 2: intentId — web voice call-booking intent
    if (!patient && intentId) {
      const intent = await prisma.callBookingIntent.findFirst({
        where: { id: intentId, doctorId, expiresAt: { gt: new Date() } },
        include: { patient: true },
      })
      if (intent) {
        patient = intent.patient
        await prisma.callBookingIntent.delete({ where: { id: intent.id } })
      }
    }

    // Priority 3: phone-based intent match (legacy PSTN fallback)
    if (!patient && patientPhone) {
      const normalizedPhone = patientPhone.replace(/\D/g, '')
      const phoneIntent = await prisma.callBookingIntent.findFirst({
        where: { doctorId, expiresAt: { gt: new Date() } },
        include: { patient: true },
        orderBy: { createdAt: 'desc' },
      })
      if (phoneIntent?.phone) {
        const intentPhone = phoneIntent.phone.replace(/\D/g, '')
        if (intentPhone === normalizedPhone) {
          patient = phoneIntent.patient
          await prisma.callBookingIntent.delete({ where: { id: phoneIntent.id } })
        }
      }
    }

    // Priority 4: email lookup
    if (!patient && patientEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: patientEmail },
        include: { patient: true },
      })
      if (existingUser?.patient) patient = existingUser.patient
    }

    // Priority 5: phone lookup
    if (!patient && patientPhone) {
      patient = await prisma.patient.findFirst({ where: { phone: patientPhone } })
    }

    // Priority 6: create temp patient (PSTN only — never reached for web voice)
    if (!patient) {
      if (!patientName || !patientPhone) {
        res.status(400).json({ success: false, message: 'Could not identify patient. Provide patientId or intentId.' })
        return
      }
      const [firstName, ...lastNameParts] = patientName.trim().split(' ')
      const lastName = lastNameParts.join(' ') || firstName

      const user = await prisma.user.create({
        data: {
          email: patientEmail ?? `${patientPhone}@temp.com`,
          password: await bcrypt.hash('temp123', 10),
          role: 'PATIENT',
        },
      })

      patient = await prisma.patient.create({
        data: { userId: user.id, firstName, lastName, phone: patientPhone },
      })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        scheduledAt: new Date(`${date}T${time}`),
        duration: parseInt(String(duration)),
        status: 'PENDING',
        source: 'CALLING_AGENT',
        reason: reason ?? 'Booked via voice assistant',
      },
      include: { patient: true, doctor: { include: { specialty: true } } },
    })

    // Best-effort: mirror the appointment onto the doctor's Google Calendar.
    if (doctor.googleCalendarConnected) {
      const eventId = await createCalendarEvent(doctor, {
        start: appointment.scheduledAt,
        end: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60000),
        summary: `Appointment with ${appointment.patient.firstName} ${appointment.patient.lastName}`,
        description: appointment.reason ?? 'Booked via voice assistant.',
      })
      if (eventId) {
        await prisma.appointment
          .update({ where: { id: appointment.id }, data: { googleEventId: eventId } })
          .catch(() => {})
      }
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment.id,
        patient: {
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          phone: appointment.patient.phone,
        },
        doctor: {
          name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          specialty: appointment.doctor.specialty?.name,
        },
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
        status: appointment.status,
        reason: appointment.reason,
      },
    })
  } catch (error) {
    const err = error as Error
    console.error('Book appointment error:', err)
    res.status(500).json({ success: false, message: 'Server error while booking appointment', error: err.message })
  }
}

export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialty, city } = req.query as { specialty?: string; city?: string }

    const where: Record<string, unknown> = { isActive: true, verificationStatus: 'APPROVED' }

    if (specialty) {
      // Resolve to canonical row via name or alias — no substring matching
      const byName = await prisma.specialty.findFirst({
        where: { name: { equals: specialty, mode: 'insensitive' } },
        select: { id: true },
      })

      let resolvedId = byName?.id

      if (!resolvedId) {
        const byAlias = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Specialty"
          WHERE EXISTS (SELECT 1 FROM unnest(aliases) AS a WHERE lower(a) = lower(${specialty}))
          LIMIT 1
        `
        resolvedId = byAlias[0]?.id
      }

      if (resolvedId) {
        where.specialtyId = resolvedId
      } else {
        // Unknown specialty — return empty rather than all doctors
        res.json({ success: true, count: 0, doctors: [] })
        return
      }
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }

    const doctors = await prisma.doctor.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true,
        phone: true, city: true, qualifications: true,
        experience: true, rating: true, consultationFee: true,
        availableFrom: true, availableTo: true, workingDays: true,
        specialty: { select: { id: true, name: true, description: true } },
      },
      orderBy: { rating: 'desc' },
    })

    res.json({
      success: true,
      count: doctors.length,
      doctors: doctors.map((doc) => ({
        id: doc.id,
        name: `Dr. ${doc.firstName} ${doc.lastName}`,
        specialty: doc.specialty?.name,
        city: doc.city,
        experience: doc.experience,
        rating: doc.rating,
        consultationFee: doc.consultationFee,
        workingHours: { from: doc.availableFrom, to: doc.availableTo },
        workingDays: doc.workingDays,
      })),
    })
  } catch (error) {
    console.error('Get doctors error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching doctors' })
  }
}

export const getSpecialtiesForAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const specialties = await prisma.specialty.findMany({
      select: { id: true, name: true, description: true, aliases: true },
      orderBy: { name: 'asc' },
    })

    res.json({
      success: true,
      count: specialties.length,
      specialties: specialties.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        aliases: s.aliases,
      })),
      // Flat name list for easy LLM prompt injection
      names: specialties.map((s) => s.name),
    })
  } catch (error) {
    console.error('Get specialties error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching specialties' })
  }
}

export const getCitiesForAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    // Distinct cities from active, approved doctors only
    const rows = await prisma.doctor.findMany({
      where: { isActive: true, verificationStatus: 'APPROVED' },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    })

    const cities = rows.map((r) => r.city).filter(Boolean)

    res.json({
      success: true,
      count: cities.length,
      cities,
    })
  } catch (error) {
    console.error('Get cities error:', error)
    res.status(500).json({ success: false, message: 'Server error while fetching cities' })
  }
}

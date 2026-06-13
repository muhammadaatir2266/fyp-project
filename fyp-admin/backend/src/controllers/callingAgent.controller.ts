import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../config/database'

async function getSuggestedTimeSlots(
  doctorId: string,
  date: string,
  availableFrom: string,
  availableTo: string
): Promise<string[]> {
  const startHour = parseInt(availableFrom.split(':')[0])
  const startMinute = parseInt(availableFrom.split(':')[1])
  const endHour = parseInt(availableTo.split(':')[0])

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

  const slots: string[] = []

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of [0, 30]) {
      if (hour === startHour && minute < startMinute) continue

      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const slotStart = new Date(`${date}T${timeString}`)
      const slotEnd = new Date(slotStart.getTime() + 30 * 60000)

      const hasConflict = existingAppointments.some((apt: { scheduledAt: Date; duration: number }) => {
        const aptStart = new Date(apt.scheduledAt)
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000)
        return slotStart < aptEnd && slotEnd > aptStart
      })

      if (!hasConflict) slots.push(timeString)
    }
  }

  return slots.slice(0, 10)
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
        workingDays: true, unavailableDates: true, isActive: true,
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

    const availableFrom = doctor.availableFrom ?? '09:00'
    const availableTo = doctor.availableTo ?? '17:00'

    if (time < availableFrom || time >= availableTo) {
      res.json({
        success: false, available: false,
        message: "Requested time is outside doctor's working hours",
        doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
        workingHours: { from: availableFrom, to: availableTo },
      })
      return
    }

    const startTime = new Date(requestedDateTime)
    const endTime = new Date(startTime.getTime() + 30 * 60000)
    const dayStart = new Date(`${date}T00:00:00`)
    const dayEnd = new Date(`${date}T23:59:59`)

    const existingAppointments = await prisma.appointment.findMany({
      where: { doctorId, scheduledAt: { gte: dayStart, lte: dayEnd }, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { scheduledAt: true, duration: true },
    })

    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.scheduledAt)
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000)
      return startTime < aptEnd && endTime > aptStart
    })

    if (hasConflict) {
      res.json({
        success: false, available: false,
        message: 'This time slot is already booked',
        doctor: { id: doctor.id, name: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialty: doctor.specialty?.name },
        suggestedTimes: await getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo),
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
        workingDays: true, unavailableDates: true, isActive: true,
        specialty: { select: { name: true } },
      },
    })

    if (!doctor || !doctor.isActive) {
      res.status(404).json({ success: false, message: 'Doctor not found or not active' })
      return
    }

    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' })

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

    const availableFrom = doctor.availableFrom ?? '09:00'
    const availableTo = doctor.availableTo ?? '17:00'
    const slots = await getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo)

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
    const { patientName, patientPhone, patientEmail, date, time, reason, duration = 30 } = req.body as {
      patientName?: string
      patientPhone?: string
      patientEmail?: string
      date?: string
      time?: string
      reason?: string
      duration?: number | string
    }

    if (!patientName || !patientPhone || !date || !time) {
      res.status(400).json({ success: false, message: 'Missing required fields: patientName, patientPhone, date, time' })
      return
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    })

    if (!doctor || !doctor.isActive) {
      res.status(404).json({ success: false, message: 'Doctor not found or not active' })
      return
    }

    let patient = null

    if (patientEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: patientEmail },
        include: { patient: true },
      })
      if (existingUser?.patient) patient = existingUser.patient
    }

    if (!patient) {
      patient = await prisma.patient.findFirst({ where: { phone: patientPhone } })
    }

    if (!patient) {
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
        reason: reason ?? 'Phone consultation',
      },
      include: { patient: true, doctor: { include: { specialty: true } } },
    })

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
    const { specialty } = req.query as { specialty?: string }

    const where: Record<string, unknown> = { isActive: true }

    if (specialty) {
      where.specialty = { name: { contains: specialty, mode: 'insensitive' } }
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

const prisma = require('../config/database');

/**
 * Check doctor availability for a specific date and time
 * Requires API token authentication
 */
const checkDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required',
        example: '/api/v1/doctors/{doctorId}/availability?date=2024-03-15&time=14:30'
      });
    }

    // Find doctor
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        availableFrom: true,
        availableTo: true,
        workingDays: true,
        unavailableDates: true,
        isActive: true,
        specialty: {
          select: {
            name: true
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!doctor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not currently accepting appointments'
      });
    }

    // Parse requested date and time
    const requestedDate = new Date(date);
    const requestedDateTime = new Date(`${date}T${time}`);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if date is in the past
    const now = new Date();
    if (requestedDateTime < now) {
      return res.json({
        success: false,
        available: false,
        message: 'Cannot book appointments in the past',
        doctor: {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialty: doctor.specialty?.name
        }
      });
    }

    // Check if date is blocked by doctor
    if (doctor.unavailableDates && doctor.unavailableDates.length > 0) {
      const isBlocked = doctor.unavailableDates.some(blockedDate => {
        const blocked = new Date(blockedDate);
        return blocked.toDateString() === requestedDate.toDateString();
      });

      if (isBlocked) {
        return res.json({
          success: false,
          available: false,
          message: 'Doctor is not available on this date',
          doctor: {
            id: doctor.id,
            name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            specialty: doctor.specialty?.name
          }
        });
      }
    }

    // Check if doctor works on this day
    if (!doctor.workingDays || !doctor.workingDays.includes(dayOfWeek)) {
      return res.json({
        success: false,
        available: false,
        message: `Doctor does not work on ${dayOfWeek}`,
        doctor: {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialty: doctor.specialty?.name
        },
        workingDays: doctor.workingDays || []
      });
    }

    // Check if time is within working hours
    const requestedTime = time;
    const availableFrom = doctor.availableFrom || '09:00';
    const availableTo = doctor.availableTo || '17:00';

    if (requestedTime < availableFrom || requestedTime >= availableTo) {
      return res.json({
        success: false,
        available: false,
        message: 'Requested time is outside doctor\'s working hours',
        doctor: {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialty: doctor.specialty?.name
        },
        workingHours: {
          from: availableFrom,
          to: availableTo
        }
      });
    }

    // Check for existing appointments at this time
    // Requested slot: startTime to endTime (30 minutes)
    const startTime = new Date(requestedDateTime);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    // Get all appointments for this doctor on this day
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      select: {
        scheduledAt: true,
        duration: true
      }
    });

    // Check for overlapping appointments
    const hasConflict = existingAppointments.some(apt => {
      const aptStart = new Date(apt.scheduledAt);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
      // Two time slots overlap if: slotStart < aptEnd AND slotEnd > aptStart
      return (startTime < aptEnd && endTime > aptStart);
    });

    if (hasConflict) {
      return res.json({
        success: false,
        available: false,
        message: 'This time slot is already booked',
        doctor: {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialty: doctor.specialty?.name
        },
        suggestedTimes: await getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo)
      });
    }

    // Slot is available
    return res.json({
      success: true,
      available: true,
      message: 'Time slot is available',
      doctor: {
        id: doctor.id,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.specialty?.name
      },
      slot: {
        date: date,
        time: time,
        duration: 30
      }
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking availability'
    });
  }
};

/**
 * Get available time slots for a doctor on a specific date
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
        example: '/api/v1/doctors/{doctorId}/slots?date=2024-03-15'
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        availableFrom: true,
        availableTo: true,
        workingDays: true,
        unavailableDates: true,
        isActive: true,
        specialty: {
          select: {
            name: true
          }
        }
      }
    });

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not active'
      });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if date is blocked
    if (doctor.unavailableDates && doctor.unavailableDates.length > 0) {
      const isBlocked = doctor.unavailableDates.some(blockedDate => {
        const blocked = new Date(blockedDate);
        return blocked.toDateString() === requestedDate.toDateString();
      });

      if (isBlocked) {
        return res.json({
          success: true,
          available: false,
          message: 'Doctor is not available on this date',
          slots: []
        });
      }
    }

    if (!doctor.workingDays || !doctor.workingDays.includes(dayOfWeek)) {
      return res.json({
        success: true,
        available: false,
        message: `Doctor does not work on ${dayOfWeek}`,
        slots: [],
        workingDays: doctor.workingDays || []
      });
    }

    const availableFrom = doctor.availableFrom || '09:00';
    const availableTo = doctor.availableTo || '17:00';

    const slots = await getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo);

    return res.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialty: doctor.specialty?.name
      },
      date: date,
      slots: slots
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots'
    });
  }
};

/**
 * Book an appointment (API token protected)
 */
const bookAppointment = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      patientName,
      patientPhone,
      patientEmail,
      date,
      time,
      reason,
      duration = 30
    } = req.body;

    if (!patientName || !patientPhone || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientName, patientPhone, date, time'
      });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not active'
      });
    }

    // Find or create patient
    let patient;
    
    if (patientEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: patientEmail },
        include: { patient: true }
      });

      if (existingUser && existingUser.patient) {
        patient = existingUser.patient;
      }
    }

    if (!patient) {
      patient = await prisma.patient.findFirst({
        where: { phone: patientPhone }
      });
    }

    if (!patient) {
      const [firstName, ...lastNameParts] = patientName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      const user = await prisma.user.create({
        data: {
          email: patientEmail || `${patientPhone}@temp.com`,
          password: await require('bcryptjs').hash('temp123', 10),
          role: 'PATIENT'
        }
      });

      patient = await prisma.patient.create({
        data: {
          userId: user.id,
          firstName: firstName,
          lastName: lastName,
          phone: patientPhone
        }
      });
    }

    const scheduledAt = new Date(`${date}T${time}`);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctorId,
        scheduledAt: scheduledAt,
        duration: parseInt(duration),
        status: 'PENDING',
        source: 'CALLING_AGENT',
        reason: reason || 'Phone consultation'
      },
      include: {
        patient: true,
        doctor: {
          include: {
            specialty: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment.id,
        patient: {
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          phone: appointment.patient.phone
        },
        doctor: {
          name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          specialty: appointment.doctor.specialty?.name
        },
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
        status: appointment.status,
        reason: appointment.reason
      }
    });

  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment',
      error: error.message
    });
  }
};

/**
 * Get list of all active doctors
 */
const getDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;

    const where = {
      isActive: true
    };

    if (specialty) {
      where.specialty = {
        name: {
          contains: specialty,
          mode: 'insensitive'
        }
      };
    }

    const doctors = await prisma.doctor.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
        qualifications: true,
        experience: true,
        rating: true,
        consultationFee: true,
        availableFrom: true,
        availableTo: true,
        workingDays: true,
        specialty: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    return res.json({
      success: true,
      count: doctors.length,
      doctors: doctors.map(doc => ({
        id: doc.id,
        name: `Dr. ${doc.firstName} ${doc.lastName}`,
        specialty: doc.specialty?.name,
        city: doc.city,
        experience: doc.experience,
        rating: doc.rating,
        consultationFee: doc.consultationFee,
        workingHours: {
          from: doc.availableFrom,
          to: doc.availableTo
        },
        workingDays: doc.workingDays
      }))
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctors'
    });
  }
};

async function getSuggestedTimeSlots(doctorId, date, availableFrom, availableTo) {
  const slots = [];
  const startHour = parseInt(availableFrom.split(':')[0]);
  const startMinute = parseInt(availableFrom.split(':')[1]);
  const endHour = parseInt(availableTo.split(':')[0]);

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
      scheduledAt: {
        gte: dayStart,
        lte: dayEnd
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    },
    select: {
      scheduledAt: true,
      duration: true
    }
  });

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === startHour && minute < startMinute) continue;
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const slotStart = new Date(`${date}T${timeString}`);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60000);

      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
        return (slotStart < aptEnd && slotEnd > aptStart);
      });

      if (!hasConflict) {
        slots.push(timeString);
      }
    }
  }

  return slots.slice(0, 10);
}

module.exports = {
  checkDoctorAvailability,
  getAvailableSlots,
  bookAppointment,
  getDoctors
};

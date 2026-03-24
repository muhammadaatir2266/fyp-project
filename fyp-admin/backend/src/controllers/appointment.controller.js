const prisma = require('../config/database');

const getAppointments = async (req, res) => {
  try {
    const { doctorId, status, source, startDate, endDate } = req.query;

    const where = {};

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (source && source !== 'ALL') {
      where.source = source;
    }

    if (startDate && endDate) {
      where.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          include: {
            specialty: true
          }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: {
            specialty: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes })
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

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        patient: true,
        doctor: true
      }
    });

    res.json(appointment);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment
};

const prisma = require('../config/database');

const getAppointments = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { status } = req.query;

    const where = { doctorId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true
      },
      orderBy: {
        scheduledAt: 'desc'
      }
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
    const doctorId = req.doctorId;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorId
      },
      include: {
        patient: true
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
    const doctorId = req.doctorId;
    const { status, notes, scheduledAt } = req.body;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorId
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) })
      },
      include: {
        patient: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAppointments, getAppointmentById, updateAppointment };

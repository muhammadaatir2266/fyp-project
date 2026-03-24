const prisma = require('../config/database');

const getPatients = async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      select: {
        patient: true
      },
      distinct: ['patientId']
    });

    const patients = appointments.map(apt => apt.patient);

    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctorId;

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: id,
        doctorId
      }
    });

    if (!hasAppointment) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientSymptoms = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctorId;

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: id,
        doctorId
      }
    });

    if (!hasAppointment) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const symptoms = await prisma.patientSymptom.findMany({
      where: { patientId: id },
      include: {
        symptom: true
      },
      orderBy: {
        reportedAt: 'desc'
      }
    });

    res.json(symptoms);
  } catch (error) {
    console.error('Get patient symptoms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientPredictions = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctorId;

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: id,
        doctorId
      }
    });

    if (!hasAppointment) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const predictions = await prisma.prediction.findMany({
      where: {
        chatSession: {
          patientId: id
        }
      },
      include: {
        disease: {
          include: {
            recommendedSpecialty: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(predictions);
  } catch (error) {
    console.error('Get patient predictions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientChatHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctorId;

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: id,
        doctorId
      }
    });

    if (!hasAppointment) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const chatSessions = await prisma.chatSession.findMany({
      where: { patientId: id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: 1
    });

    const messages = chatSessions[0]?.messages || [];

    res.json(messages);
  } catch (error) {
    console.error('Get patient chat history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctorId;

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: id,
        doctorId
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  getPatientSymptoms,
  getPatientPredictions,
  getPatientChatHistory,
  getPatientAppointments
};

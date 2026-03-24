const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const getDoctors = async (req, res) => {
  try {
    const { search, specialty, status, verificationStatus } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    if (specialty) {
      where.specialtyId = specialty;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Filter by verification status
    if (verificationStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(verificationStatus)) {
      where.verificationStatus = verificationStatus;
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        specialty: true,
        user: {
          select: {
            email: true
          }
        },
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        specialty: true,
        user: {
          select: {
            email: true
          }
        },
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            patient: true
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      specialtyId,
      phone,
      address,
      city,
      qualifications,
      experience,
      consultationFee
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and doctor
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'DOCTOR',
        doctor: {
          create: {
            firstName,
            lastName,
            specialtyId,
            phone,
            address,
            city,
            qualifications,
            experience: parseInt(experience) || 0,
            consultationFee: parseFloat(consultationFee) || 0
          }
        }
      },
      include: {
        doctor: {
          include: {
            specialty: true
          }
        }
      }
    });

    res.status(201).json(user.doctor);
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const doctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
      include: {
        specialty: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json(doctor);
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.doctor.delete({
      where: { id }
    });

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const toggleDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: { isActive: !doctor.isActive },
      include: {
        specialty: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json(updatedDoctor);
  } catch (error) {
    console.error('Toggle doctor status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getSpecialties = async (req, res) => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(specialties);
  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve doctor application
const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id; // From auth middleware

    const doctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.verificationStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Doctor is already approved' });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        isActive: true,
        verifiedAt: new Date(),
        verifiedBy: adminId
      },
      include: {
        specialty: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json({ 
      message: 'Doctor approved successfully',
      doctor: updatedDoctor 
    });
  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject doctor application
const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id; // From auth middleware

    if (!notes || notes.trim() === '') {
      return res.status(400).json({ message: 'Rejection notes are required' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.verificationStatus === 'REJECTED') {
      return res.status(400).json({ message: 'Doctor is already rejected' });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        isActive: false,
        verificationNotes: notes,
        verifiedAt: new Date(),
        verifiedBy: adminId
      },
      include: {
        specialty: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    res.json({ 
      message: 'Doctor rejected successfully',
      doctor: updatedDoctor 
    });
  } catch (error) {
    console.error('Reject doctor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get verification document
const getVerificationDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        verificationDocument: true
      }
    });

    if (!doctor || !doctor.verificationDocument) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Security: Validate path to prevent directory traversal
    const filePath = path.join(__dirname, '../..', doctor.verificationDocument);
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.join(__dirname, '../..', 'uploads');

    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ message: 'Document file not found' });
    }

    res.sendFile(normalizedPath);
  } catch (error) {
    console.error('Get verification document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  getSpecialties,
  approveDoctor,
  rejectDoctor,
  getVerificationDocument
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/verification-documents');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
  }
}).single('verificationDocument');

const signup = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { firstName, lastName, email, password, phone, specialization, licenseNumber, clinicLocation, address, city } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'Verification document is required' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Find or create specialty
      let specialty = await prisma.specialty.findFirst({
        where: { name: specialization }
      });

      if (!specialty) {
        specialty = await prisma.specialty.create({
          data: { name: specialization }
        });
      }

      // Create user and doctor profile with PENDING status
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'DOCTOR',
          doctor: {
            create: {
              firstName,
              lastName,
              phone,
              specialtyId: specialty.id,
              licenseNumber,
              clinicLocation,
              address,
              city,
              verificationDocument: `/uploads/verification-documents/${req.file.filename}`,
              verificationStatus: 'PENDING',
              isActive: false,
              isVerified: false
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

      res.status(201).json({
        message: 'Application submitted successfully. Please wait for admin approval.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          doctor: {
            ...user.doctor,
            verificationStatus: user.doctor.verificationStatus
          }
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      // Delete uploaded file if error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Server error' });
    }
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        doctor: {
          include: {
            specialty: true
          }
        }
      }
    });

    if (!user || user.role !== 'DOCTOR') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if doctor is approved
    if (user.doctor && user.doctor.verificationStatus === 'PENDING') {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }

    if (user.doctor && user.doctor.verificationStatus === 'REJECTED') {
      return res.status(403).json({ message: 'Your account application was rejected' });
    }

    if (user.doctor && !user.doctor.isActive) {
      return res.status(403).json({ message: 'Your account is inactive. Please contact admin.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctor: user.doctor
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { 
        doctor: {
          include: {
            specialty: true
          }
        }
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { signup, login, getMe };

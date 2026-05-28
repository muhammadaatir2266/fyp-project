import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import prisma from '../config/database'
import { generateToken } from '../lib/jwt'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/verification-documents')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'))
    }
  },
}).single('verificationDocument')

export const signup = (req: Request, res: Response): void => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: (err as Error).message })
      return
    }

    try {
      const { firstName, lastName, email, password, phone, specialization, licenseNumber, clinicLocation, address, city } =
        req.body as Record<string, string>

      if (!req.file) {
        res.status(400).json({ message: 'Verification document is required' })
        return
      }

      const existingUser = await prisma.user.findUnique({ where: { email } })

      if (existingUser) {
        fs.unlinkSync(req.file.path)
        res.status(400).json({ message: 'Email already registered' })
        return
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      let specialty = await prisma.specialty.findFirst({ where: { name: specialization } })

      if (!specialty) {
        specialty = await prisma.specialty.create({ data: { name: specialization } })
      }

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
              isVerified: false,
            },
          },
        },
        include: {
          doctor: {
            include: { specialty: true },
          },
        },
      })

      res.status(201).json({
        message: 'Application submitted successfully. Please wait for admin approval.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          doctor: {
            ...user.doctor,
            verificationStatus: user.doctor?.verificationStatus,
          },
        },
      })
    } catch (error) {
      console.error('Signup error:', error)
      if (req.file) fs.unlinkSync(req.file.path)
      res.status(500).json({ message: 'Server error' })
    }
  })
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { doctor: { include: { specialty: true } } },
    })

    if (!user || user.role !== 'DOCTOR') {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    if (user.doctor?.verificationStatus === 'PENDING') {
      res.status(403).json({ message: 'Your account is pending admin approval' })
      return
    }

    if (user.doctor?.verificationStatus === 'REJECTED') {
      res.status(403).json({ message: 'Your account application was rejected' })
      return
    }

    if (user.doctor && !user.doctor.isActive) {
      res.status(403).json({ message: 'Your account is inactive. Please contact admin.' })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = generateToken({ userId: user.id, role: user.role })

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, doctor: user.doctor },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { doctor: { include: { specialty: true } } },
    })

    res.json(user)
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'
import path from 'path'
import prisma from '../config/database'
import { generateToken } from '../lib/jwt'
import { cityCentroid } from '../lib/geocode'
import { getPresignedPutUrl, headObject, deleteObject, isR2Key } from '../lib/r2'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const presignSchema = z.object({
  uploadSessionId: z.string().uuid('uploadSessionId must be a valid UUID'),
  documentType: z.enum(['MEDICAL_LICENSE', 'DEGREE_CERTIFICATE', 'GOVERNMENT_ID', 'OTHER']),
  fileName: z.string().min(1),
  mimeType: z.string().refine((m) => ALLOWED_MIME_TYPES.includes(m), {
    message: 'Only PDF, JPG, and PNG files are allowed',
  }),
  fileSize: z.number().max(MAX_FILE_SIZE, 'File size must be less than 5 MB'),
})

const documentItemSchema = z.object({
  type: z.enum(['MEDICAL_LICENSE', 'DEGREE_CERTIFICATE', 'GOVERNMENT_ID', 'OTHER']),
  s3Key: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string(),
  fileSize: z.number(),
})

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(1),
  specialtyId: z.string().uuid('specialtyId must be a valid UUID'),
  licenseNumber: z.string().min(1),
  clinicLocation: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  experience: z.number().int().min(0).default(0),
  qualifications: z.string().optional(),
  consultationFee: z.number().positive().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  languages: z.array(z.string()).default([]),
  workingDays: z.array(z.string()).default([]),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  uploadSessionId: z.string().uuid(),
  documents: z.array(documentItemSchema).min(1, 'At least one verification document is required'),
})

// GET /auth/specialties
export const getSpecialties = async (req: Request, res: Response): Promise<void> => {
  try {
    const specialties = await prisma.specialty.findMany({ orderBy: { name: 'asc' } })
    res.json({ specialties })
  } catch (error) {
    console.error('Get specialties error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /auth/documents/presign
export const presignDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uploadSessionId, documentType, fileName, mimeType, fileSize } = presignSchema.parse(req.body)

    const ext = path.extname(fileName) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg')
    const key = `pending/${uploadSessionId}/${documentType}/${crypto.randomUUID()}${ext}`

    const uploadUrl = await getPresignedPutUrl(key, mimeType, 300)

    res.json({ uploadUrl, s3Key: key })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0].message })
      return
    }
    console.error('Presign error:', error)
    res.status(500).json({ message: 'Failed to generate upload URL' })
  }
}

// POST /auth/signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  let parsedDocuments: z.infer<typeof documentItemSchema>[] = []

  try {
    const data = signupSchema.parse(req.body)
    parsedDocuments = data.documents

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' })
      return
    }

    const specialty = await prisma.specialty.findUnique({ where: { id: data.specialtyId } })
    if (!specialty) {
      res.status(400).json({ message: 'Selected specialty not found' })
      return
    }

    // Verify all documents exist in R2 under the expected session prefix
    const sessionPrefix = `pending/${data.uploadSessionId}/`
    for (const doc of data.documents) {
      if (!doc.s3Key.startsWith(sessionPrefix)) {
        res.status(400).json({ message: `Document key ${doc.s3Key} does not belong to this upload session` })
        return
      }
      const exists = await headObject(doc.s3Key)
      if (!exists) {
        res.status(400).json({ message: `Document ${doc.fileName} was not uploaded successfully. Please re-upload.` })
        return
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)
    const primaryDoc = data.documents.find((d) => d.type === 'MEDICAL_LICENSE') ?? data.documents[0]

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'DOCTOR',
        doctor: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            specialtyId: specialty.id,
            licenseNumber: data.licenseNumber,
            clinicLocation: data.clinicLocation,
            address: data.address,
            city: data.city,
            ...(cityCentroid(data.city) ?? {}),
            experience: data.experience,
            qualifications: data.qualifications,
            consultationFee: data.consultationFee,
            ...(data.gender && { gender: data.gender }),
            languages: data.languages,
            workingDays: data.workingDays,
            availableFrom: data.availableFrom,
            availableTo: data.availableTo,
            // Keep legacy field for backward compat with existing admin views
            verificationDocument: primaryDoc.s3Key,
            verificationStatus: 'PENDING',
            isActive: false,
            isVerified: false,
            verificationDocuments: {
              create: data.documents.map((doc) => ({
                type: doc.type,
                s3Key: doc.s3Key,
                fileName: doc.fileName,
                mimeType: doc.mimeType,
                fileSize: doc.fileSize,
              })),
            },
          },
        },
      },
      include: {
        doctor: { include: { specialty: true, verificationDocuments: true } },
      },
    })

    res.status(201).json({
      message: 'Application submitted successfully. Please wait for admin approval.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctor: {
          id: user.doctor?.id,
          verificationStatus: user.doctor?.verificationStatus,
          specialty: user.doctor?.specialty,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.issues[0].message })
      return
    }
    console.error('Signup error:', error)
    // Best-effort cleanup of uploaded R2 objects
    if (parsedDocuments.length > 0) {
      await Promise.allSettled(parsedDocuments.map((d) => deleteObject(d.s3Key)))
    }
    res.status(500).json({ message: 'Server error during registration' })
  }
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

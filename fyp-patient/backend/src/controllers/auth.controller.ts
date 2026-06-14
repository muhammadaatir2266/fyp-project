import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateToken } from "../lib/jwt";
import { AppError } from "../middleware/error.middleware";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

// Unified login — handles PATIENT, DOCTOR, and ADMIN roles so the
// website can use a single endpoint and redirect by role.
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: { include: { specialty: true } },
        admin: true,
      },
    });

    if (!user) throw new AppError("Invalid email or password", 401);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new AppError("Invalid email or password", 401);

    // Role-specific checks
    if (user.role === "DOCTOR") {
      if (!user.doctor) throw new AppError("Invalid credentials", 401);
      if (user.doctor.verificationStatus === "PENDING") {
        throw new AppError("Your account is pending admin approval. You will be notified by email once approved.", 403);
      }
      if (user.doctor.verificationStatus === "REJECTED") {
        throw new AppError("Your account application was rejected. Please contact support.", 403);
      }
      if (!user.doctor.isActive) {
        throw new AppError("Your account is inactive. Please contact admin.", 403);
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userData: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (user.role === "PATIENT" && user.patient) {
      userData.patient = {
        id: user.patient.id,
        firstName: user.patient.firstName,
        lastName: user.patient.lastName,
        phone: user.patient.phone,
        dateOfBirth: user.patient.dateOfBirth,
        gender: user.patient.gender,
      };
    }

    if (user.role === "DOCTOR" && user.doctor) {
      userData.doctor = {
        id: user.doctor.id,
        firstName: user.doctor.firstName,
        lastName: user.doctor.lastName,
        specialty: user.doctor.specialty,
        verificationStatus: user.doctor.verificationStatus,
      };
    }

    if (user.role === "ADMIN" && user.admin) {
      userData.admin = {
        id: user.admin.id,
        firstName: user.admin.firstName,
        lastName: user.admin.lastName,
      };
    }

    res.json({ token, user: userData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) throw new AppError("User with this email already exists", 409);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: "PATIENT",
        patient: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender,
          },
        },
      },
      include: { patient: true },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userData: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (user.patient) {
      userData.patient = {
        id: user.patient.id,
        firstName: user.patient.firstName,
        lastName: user.patient.lastName,
        phone: user.patient.phone,
      };
    }

    res.status(201).json({
      token,
      user: userData,
      message: "Account created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
};

export const getSpecialties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ specialties });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError("Authentication required", 401);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { patient: true },
    });

    if (!user) throw new AppError("User not found", 404);

    const userData: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    if (user.patient) {
      userData.patient = {
        id: user.patient.id,
        firstName: user.patient.firstName,
        lastName: user.patient.lastName,
        phone: user.patient.phone,
        dateOfBirth: user.patient.dateOfBirth,
        gender: user.patient.gender,
      };
    }

    res.json({ user: userData });
  } catch (error) {
    next(error);
  }
};

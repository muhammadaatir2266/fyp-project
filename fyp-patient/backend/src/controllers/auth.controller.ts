import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { generateToken } from "../lib/jwt";
import { AppError } from "../middleware/error.middleware";
import { z } from "zod";

// Validation schemas
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

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Prepare user data
    const userData: any = {
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

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    throw error;
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    // Validate input
    const data = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user and patient record (force PATIENT role)
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
      include: {
        patient: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Prepare response
    const userData: any = {
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
    throw error;
  }
};

export const getSpecialties = async (req: Request, res: Response) => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ specialties });
  } catch (error) {
    throw error;
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        patient: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prepare user data
    const userData: any = {
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
    throw error;
  }
};

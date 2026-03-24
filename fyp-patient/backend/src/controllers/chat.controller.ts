import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  location: z.string().optional(),
});

const WEBHOOK_URL =
  process.env.N8N_CHAT_WEBHOOK_URL ||
  "https://fyp2026.app.n8n.cloud/webhook/55479a0c-6a9f-4083-ad95-8cbe28d9e828";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    // Validate input
    const { message, location } = messageSchema.parse(req.body);

    // Get authenticated user
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    // Get patient info
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        patient: true,
      },
    });

    if (!user || !user.patient) {
      throw new AppError("Patient profile not found", 404);
    }

    // Prepare webhook payload
    const webhookPayload = {
      patient_id: user.patient.id,
      message: message,
      user_info: {
        email: user.email,
        firstName: user.patient.firstName,
        lastName: user.patient.lastName,
        phone: user.patient.phone,
        dateOfBirth: user.patient.dateOfBirth,
        gender: user.patient.gender,
        medicalHistory: user.patient.medicalHistory,
        allergies: user.patient.allergies,
      },
      location: location || user.patient.city,
      timestamp: new Date().toISOString(),
    };

    // Call n8n webhook
    const webhookResponse = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    // Extract message from n8n response
    // n8n returns: { success: true, data: "message text" }
    const n8nData = webhookResponse.data;
    let responseMessage = "";

    if (typeof n8nData === "string") {
      // Direct string response
      responseMessage = n8nData;
    } else if (n8nData?.data) {
      // Response with data field (string or object)
      if (typeof n8nData.data === "string") {
        responseMessage = n8nData.data;
      } else if (n8nData.data.message) {
        responseMessage = n8nData.data.message;
      } else if (n8nData.data.response) {
        responseMessage = n8nData.data.response;
      }
    } else if (n8nData?.message) {
      responseMessage = n8nData.message;
    } else if (n8nData?.response) {
      responseMessage = n8nData.response;
    } else {
      responseMessage = "I received your message. How can I help you?";
    }

    // Return formatted response to frontend
    res.json({
      success: true,
      data: {
        message: responseMessage,
        response: responseMessage, // For backward compatibility
        prediction: n8nData?.prediction,
        doctors: n8nData?.doctors,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    if (axios.isAxiosError(error)) {
      console.error("Webhook error:", error.response?.data || error.message);
      throw new AppError(
        "Failed to process message. Please try again later.",
        503
      );
    }

    throw error;
  }
};

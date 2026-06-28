-- Add patient privacy preference fields
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "shareDataWithAI" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "allowDoctorChatAccess" BOOLEAN NOT NULL DEFAULT true;

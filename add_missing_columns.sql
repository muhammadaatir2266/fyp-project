-- Add missing columns to Doctor table
-- Run this SQL directly on your Railway PostgreSQL database

-- Add clinicLocation column
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "clinicLocation" TEXT;

-- Add verification columns
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verificationDocument" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;

-- Update isActive default to false for new doctors
ALTER TABLE "Doctor" ALTER COLUMN "isActive" SET DEFAULT false;

-- Create DoctorVerificationStatus enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "DoctorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update verificationStatus column to use the enum type
ALTER TABLE "Doctor" ALTER COLUMN "verificationStatus" TYPE "DoctorVerificationStatus" USING "verificationStatus"::"DoctorVerificationStatus";

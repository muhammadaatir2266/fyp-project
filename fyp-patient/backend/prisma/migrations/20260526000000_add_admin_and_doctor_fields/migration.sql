-- Add BookingSource enum
DO $$ BEGIN
    CREATE TYPE "BookingSource" AS ENUM ('PATIENT_APP', 'CALLING_AGENT', 'ADMIN_PANEL', 'WALK_IN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add DoctorVerificationStatus enum
DO $$ BEGIN
    CREATE TYPE "DoctorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to Doctor
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "clinicLocation" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "unavailableDates" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verificationDocument" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verificationStatus" "DoctorVerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;

-- isActive default is true in initial migration; add isVerified if missing
-- (initial migration already has isVerified and isActive so no-ops)

-- Add missing columns to Appointment
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "source" "BookingSource" NOT NULL DEFAULT 'PATIENT_APP';
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- CreateTable Admin
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex on Admin.userId
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_userId_key" ON "Admin"("userId");

-- AddForeignKey Admin -> User
DO $$ BEGIN
    ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable ApiToken
CREATE TABLE IF NOT EXISTS "ApiToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApiToken_token_key" ON "ApiToken"("token");

DO $$ BEGIN
    ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable ApiLog
CREATE TABLE IF NOT EXISTS "ApiLog" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "ApiLog" ADD CONSTRAINT "ApiLog_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "ApiToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add updatedAt to Symptom if missing (initial migration didn't have it)
ALTER TABLE "Symptom" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt to Disease if missing
ALTER TABLE "Disease" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateEnum
CREATE TYPE "DoctorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "clinicLocation" TEXT,
ADD COLUMN "licenseNumber" TEXT,
ADD COLUMN "verificationDocument" TEXT,
ADD COLUMN "verificationStatus" "DoctorVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "verificationNotes" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verifiedBy" TEXT,
ALTER COLUMN "isActive" SET DEFAULT false;

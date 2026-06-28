-- Google Calendar availability sync fields (shared DB across doctor/patient/admin services)

-- AlterTable Doctor
ALTER TABLE "Doctor" ADD COLUMN "googleCalendarConnected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Doctor" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "googleCalendarId" TEXT DEFAULT 'primary';
ALTER TABLE "Doctor" ADD COLUMN "googleCalendarEmail" TEXT;

-- AlterTable Appointment
ALTER TABLE "Appointment" ADD COLUMN "googleEventId" TEXT;

-- Add doctor notification preference fields
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "smsNotifications" BOOLEAN NOT NULL DEFAULT false;

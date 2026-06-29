-- AlterTable
ALTER TABLE "CallLog" ADD COLUMN     "patientId" TEXT;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

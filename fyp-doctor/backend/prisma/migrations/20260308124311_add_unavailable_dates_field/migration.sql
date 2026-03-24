-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "unavailableDates" TEXT[] DEFAULT ARRAY[]::TEXT[];

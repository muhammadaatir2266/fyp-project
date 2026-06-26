-- AlterTable: add aliases column to Specialty
ALTER TABLE "Specialty" ADD COLUMN "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

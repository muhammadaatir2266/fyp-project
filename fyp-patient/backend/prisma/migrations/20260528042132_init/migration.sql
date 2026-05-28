/*
  Warnings:

  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_doctorId_fkey";

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ApiToken" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Doctor" ALTER COLUMN "isActive" SET DEFAULT false;

-- DropTable
DROP TABLE "Review";

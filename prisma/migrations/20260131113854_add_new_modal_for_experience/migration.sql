/*
  Warnings:

  - Added the required column `cancellationPolicy` to the `Experience` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('INCLUSION', 'EXCLUSION');

-- CreateEnum
CREATE TYPE "InfoSection" AS ENUM ('BRING', 'NOT_ALLOWED', 'ACCESSIBILITY', 'ADDITIONAL');

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "address" TEXT,
ADD COLUMN     "cancellationPolicy" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "country" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ExperienceHighlight" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExperienceHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceFeature" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "FeatureType" NOT NULL,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExperienceFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceSection" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExperienceSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceOperatingHour" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,

    CONSTRAINT "ExperienceOperatingHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceInfo" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "section" "InfoSection" NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExperienceInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceTicketInfo" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "address" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExperienceTicketInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExperienceHighlight" ADD CONSTRAINT "ExperienceHighlight_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceFeature" ADD CONSTRAINT "ExperienceFeature_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceSection" ADD CONSTRAINT "ExperienceSection_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceOperatingHour" ADD CONSTRAINT "ExperienceOperatingHour_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceInfo" ADD CONSTRAINT "ExperienceInfo_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTicketInfo" ADD CONSTRAINT "ExperienceTicketInfo_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

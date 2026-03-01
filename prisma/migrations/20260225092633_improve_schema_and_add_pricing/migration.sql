/*
  Warnings:

  - You are about to drop the column `numOfPeople` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Experience` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,experienceId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `participants` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerUnit` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('PER_PERSON', 'PER_GROUP', 'HOURLY', 'DAILY');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "numOfPeople",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "participants" INTEGER NOT NULL,
ADD COLUMN     "pricePerUnit" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pricingId" TEXT,
ADD COLUMN     "pricingType" "PricingType",
ADD COLUMN     "startTime" TEXT;

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "price",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ExperienceStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "provider" TEXT;

-- CreateTable
CREATE TABLE "ExperienceAvailability" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "capacityOverride" INTEGER,
    "reason" TEXT,

    CONSTRAINT "ExperienceAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperiencePricing" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "type" "PricingType" NOT NULL,
    "name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "basePrice" DOUBLE PRECISION,
    "minParticipants" INTEGER,
    "maxParticipants" INTEGER,
    "maxPeople" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperiencePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSlot" (
    "id" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER,

    CONSTRAINT "PricingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExperienceAvailability_experienceId_date_idx" ON "ExperienceAvailability"("experienceId", "date");

-- CreateIndex
CREATE INDEX "ExperiencePricing_experienceId_idx" ON "ExperiencePricing"("experienceId");

-- CreateIndex
CREATE INDEX "ExperiencePricing_active_idx" ON "ExperiencePricing"("active");

-- CreateIndex
CREATE INDEX "PricingSlot_pricingId_idx" ON "PricingSlot"("pricingId");

-- CreateIndex
CREATE INDEX "PricingSlot_date_idx" ON "PricingSlot"("date");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_experienceId_idx" ON "Booking"("experienceId");

-- CreateIndex
CREATE INDEX "Booking_date_idx" ON "Booking"("date");

-- CreateIndex
CREATE INDEX "Experience_city_idx" ON "Experience"("city");

-- CreateIndex
CREATE INDEX "Experience_country_idx" ON "Experience"("country");

-- CreateIndex
CREATE INDEX "Experience_available_idx" ON "Experience"("available");

-- CreateIndex
CREATE INDEX "Experience_vendorId_idx" ON "Experience"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_experienceId_key" ON "Favorite"("userId", "experienceId");

-- CreateIndex
CREATE INDEX "Review_experienceId_idx" ON "Review"("experienceId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- AddForeignKey
ALTER TABLE "ExperienceAvailability" ADD CONSTRAINT "ExperienceAvailability_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "ExperiencePricing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperiencePricing" ADD CONSTRAINT "ExperiencePricing_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingSlot" ADD CONSTRAINT "PricingSlot_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "ExperiencePricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

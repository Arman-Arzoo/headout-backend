/*
  Warnings:

  - You are about to drop the column `capacityOverride` on the `Booking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reservationId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryPrices` to the `ExperiencePricing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'RESERVED';
ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_PENDING';

-- DropIndex
DROP INDEX "Booking_createdAt_idx";

-- DropIndex
DROP INDEX "Booking_date_idx";

-- DropIndex
DROP INDEX "Booking_experienceId_idx";

-- DropIndex
DROP INDEX "Booking_status_idx";

-- DropIndex
DROP INDEX "Booking_userId_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "capacityOverride",
ADD COLUMN     "reservationId" TEXT;

-- AlterTable
ALTER TABLE "ExperienceAvailability" ALTER COLUMN "endTime" SET DATA TYPE TEXT,
ALTER COLUMN "startTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ExperiencePricing" ADD COLUMN     "categoryPrices" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "pricingId" TEXT,
ADD COLUMN     "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "ticketBreakdown" JSONB,
ADD COLUMN     "unitSnapshot" JSONB;

-- CreateTable
CREATE TABLE "ExperienceTicketType" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "pricingId" TEXT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExperienceTicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "ticketType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "meta" JSONB,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExperienceTicketType_experienceId_idx" ON "ExperienceTicketType"("experienceId");

-- CreateIndex
CREATE INDEX "ExperienceTicketType_pricingId_idx" ON "ExperienceTicketType"("pricingId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceTicketType_experienceId_code_key" ON "ExperienceTicketType"("experienceId", "code");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reservationId_key" ON "Booking"("reservationId");

-- AddForeignKey
ALTER TABLE "ExperienceTicketType" ADD CONSTRAINT "ExperienceTicketType_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTicketType" ADD CONSTRAINT "ExperienceTicketType_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "ExperiencePricing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

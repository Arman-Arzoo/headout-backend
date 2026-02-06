/*
  Warnings:

  - You are about to drop the column `images` on the `Experience` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('ICON', 'GALLERY', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "MediaEntityType" AS ENUM ('EXPERIENCE', 'VENDOR', 'PROFILE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('UPLOADED', 'STOCK', 'EXTERNAL');

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "images";

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "source" "MediaSource" NOT NULL DEFAULT 'UPLOADED',
    "sourceStockType" "MediaEntityType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaLink" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "entityType" "MediaEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" "FieldType" NOT NULL,
    "order" INTEGER,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_userId_idx" ON "Media"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_key_key" ON "Media"("key");

-- CreateIndex
CREATE INDEX "MediaLink_entityType_entityId_field_idx" ON "MediaLink"("entityType", "entityId", "field");

-- CreateIndex
CREATE INDEX "MediaLink_mediaId_idx" ON "MediaLink"("mediaId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLink" ADD CONSTRAINT "MediaLink_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

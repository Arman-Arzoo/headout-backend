/*
  Warnings:

  - You are about to drop the column `highlights` on the `ExperienceHighlight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExperienceHighlight" DROP COLUMN "highlights";

-- CreateTable
CREATE TABLE "ExperienceBullets" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "bullets" TEXT[],

    CONSTRAINT "ExperienceBullets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExperienceBullets" ADD CONSTRAINT "ExperienceBullets_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

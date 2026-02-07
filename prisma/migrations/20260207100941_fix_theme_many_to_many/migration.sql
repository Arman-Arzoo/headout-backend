/*
  Warnings:

  - You are about to drop the column `themeId` on the `Experience` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Experience" DROP CONSTRAINT "Experience_themeId_fkey";

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "themeId";

-- CreateTable
CREATE TABLE "_ExperienceToTheme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExperienceToTheme_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ExperienceToTheme_B_index" ON "_ExperienceToTheme"("B");

-- AddForeignKey
ALTER TABLE "_ExperienceToTheme" ADD CONSTRAINT "_ExperienceToTheme_A_fkey" FOREIGN KEY ("A") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExperienceToTheme" ADD CONSTRAINT "_ExperienceToTheme_B_fkey" FOREIGN KEY ("B") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

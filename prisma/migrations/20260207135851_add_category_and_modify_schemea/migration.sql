/*
  Warnings:

  - You are about to drop the column `category` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the `_ExperienceToTheme` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subCategoryId` to the `Experience` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ExperienceToTheme" DROP CONSTRAINT "_ExperienceToTheme_A_fkey";

-- DropForeignKey
ALTER TABLE "_ExperienceToTheme" DROP CONSTRAINT "_ExperienceToTheme_B_fkey";

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "category",
ADD COLUMN     "subCategoryId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ExperienceToTheme";

-- DropEnum
DROP TYPE "Category";

-- CreateTable
CREATE TABLE "ExperienceTheme" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,

    CONSTRAINT "ExperienceTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceTheme_experienceId_themeId_key" ON "ExperienceTheme"("experienceId", "themeId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_order_idx" ON "Category"("order");

-- CreateIndex
CREATE INDEX "SubCategory_categoryId_idx" ON "SubCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_slug_categoryId_key" ON "SubCategory"("slug", "categoryId");

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTheme" ADD CONSTRAINT "ExperienceTheme_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTheme" ADD CONSTRAINT "ExperienceTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

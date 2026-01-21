/*
  Warnings:

  - Added the required column `dailyMenuId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DailyMenuStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LOCKED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dailyMenuId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DailyMenu" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "DailyMenuStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMenuPack" (
    "id" TEXT NOT NULL,
    "dailyMenuId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMenuPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMenuVariant" (
    "id" TEXT NOT NULL,
    "dailyMenuId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "initialStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMenuVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyMenu_date_key" ON "DailyMenu"("date");

-- CreateIndex
CREATE INDEX "DailyMenu_date_idx" ON "DailyMenu"("date");

-- CreateIndex
CREATE INDEX "DailyMenu_status_idx" ON "DailyMenu"("status");

-- CreateIndex
CREATE INDEX "DailyMenuPack_dailyMenuId_idx" ON "DailyMenuPack"("dailyMenuId");

-- CreateIndex
CREATE INDEX "DailyMenuPack_packId_idx" ON "DailyMenuPack"("packId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMenuPack_dailyMenuId_packId_key" ON "DailyMenuPack"("dailyMenuId", "packId");

-- CreateIndex
CREATE INDEX "DailyMenuVariant_dailyMenuId_idx" ON "DailyMenuVariant"("dailyMenuId");

-- CreateIndex
CREATE INDEX "DailyMenuVariant_variantId_idx" ON "DailyMenuVariant"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMenuVariant_dailyMenuId_variantId_key" ON "DailyMenuVariant"("dailyMenuId", "variantId");

-- CreateIndex
CREATE INDEX "Order_dailyMenuId_idx" ON "Order"("dailyMenuId");

-- AddForeignKey
ALTER TABLE "DailyMenuPack" ADD CONSTRAINT "DailyMenuPack_dailyMenuId_fkey" FOREIGN KEY ("dailyMenuId") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMenuPack" ADD CONSTRAINT "DailyMenuPack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMenuVariant" ADD CONSTRAINT "DailyMenuVariant_dailyMenuId_fkey" FOREIGN KEY ("dailyMenuId") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMenuVariant" ADD CONSTRAINT "DailyMenuVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dailyMenuId_fkey" FOREIGN KEY ("dailyMenuId") REFERENCES "DailyMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

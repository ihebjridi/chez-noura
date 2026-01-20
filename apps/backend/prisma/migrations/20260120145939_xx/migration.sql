/*
  Warnings:

  - You are about to drop the column `employeeEmail` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `employeeName` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `mealName` on the `InvoiceItem` table. All the data in the column will be lost.
  - Added the required column `packName` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_mealId_fkey";

-- DropIndex
DROP INDEX "OrderItem_mealId_idx";

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "employeeEmail",
DROP COLUMN "employeeName",
DROP COLUMN "mealName",
ADD COLUMN     "packName" TEXT NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "mealId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

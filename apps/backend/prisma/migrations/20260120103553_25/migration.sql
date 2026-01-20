/*
  Warnings:

  - The values [SENT,OVERDUE] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `InvoiceItem` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'ISSUED', 'PAID');
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "issuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Invoice_periodStart_periodEnd_idx" ON "Invoice"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceItem_orderId_key" ON "InvoiceItem"("orderId");

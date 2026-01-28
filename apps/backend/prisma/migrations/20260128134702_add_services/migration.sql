-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_serviceId_idx" ON "Invoice"("serviceId");

-- CreateIndex
CREATE INDEX "Invoice_businessId_serviceId_idx" ON "Invoice"("businessId", "serviceId");

-- CreateIndex
CREATE INDEX "Invoice_businessId_periodStart_periodEnd_idx" ON "Invoice"("businessId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Invoice_businessId_serviceId_periodStart_periodEnd_idx" ON "Invoice"("businessId", "serviceId", "periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

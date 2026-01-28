-- AlterTable
ALTER TABLE "BusinessServicePack" ADD COLUMN     "effectiveDate" TIMESTAMP(3),
ADD COLUMN     "nextPackId" TEXT;

-- CreateIndex
CREATE INDEX "BusinessServicePack_effectiveDate_idx" ON "BusinessServicePack"("effectiveDate");

-- AddForeignKey
ALTER TABLE "BusinessServicePack" ADD CONSTRAINT "BusinessServicePack_nextPackId_fkey" FOREIGN KEY ("nextPackId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

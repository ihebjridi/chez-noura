-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Service_isPublished_idx" ON "Service"("isPublished");

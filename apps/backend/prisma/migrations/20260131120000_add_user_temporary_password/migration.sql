-- AlterTable
ALTER TABLE "User" ADD COLUMN "temporaryPasswordHash" TEXT,
ADD COLUMN "temporaryPasswordExpiresAt" TIMESTAMP(3);

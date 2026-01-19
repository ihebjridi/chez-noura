-- CreateTable
CREATE TABLE "DayLock" (
    "id" TEXT NOT NULL,
    "lockDate" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DayLock_lockDate_key" ON "DayLock"("lockDate");

-- CreateIndex
CREATE INDEX "DayLock_lockDate_idx" ON "DayLock"("lockDate");

-- CreateIndex
CREATE INDEX "Order_orderDate_status_idx" ON "Order"("orderDate", "status");

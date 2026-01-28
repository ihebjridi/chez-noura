-- CreateTable
CREATE TABLE "DailyMenuService" (
    "id" TEXT NOT NULL,
    "dailyMenuId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMenuService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMenuServiceVariant" (
    "id" TEXT NOT NULL,
    "dailyMenuServiceId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "initialStock" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMenuServiceVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyMenuService_dailyMenuId_idx" ON "DailyMenuService"("dailyMenuId");

-- CreateIndex
CREATE INDEX "DailyMenuService_serviceId_idx" ON "DailyMenuService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMenuService_dailyMenuId_serviceId_key" ON "DailyMenuService"("dailyMenuId", "serviceId");

-- CreateIndex
CREATE INDEX "DailyMenuServiceVariant_dailyMenuServiceId_idx" ON "DailyMenuServiceVariant"("dailyMenuServiceId");

-- CreateIndex
CREATE INDEX "DailyMenuServiceVariant_variantId_idx" ON "DailyMenuServiceVariant"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMenuServiceVariant_dailyMenuServiceId_variantId_key" ON "DailyMenuServiceVariant"("dailyMenuServiceId", "variantId");

-- AddForeignKey
ALTER TABLE "DailyMenuService" ADD CONSTRAINT "DailyMenuService_dailyMenuId_fkey" FOREIGN KEY ("dailyMenuId") REFERENCES "DailyMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMenuService" ADD CONSTRAINT "DailyMenuService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMenuServiceVariant" ADD CONSTRAINT "DailyMenuServiceVariant_dailyMenuServiceId_fkey" FOREIGN KEY ("dailyMenuServiceId") REFERENCES "DailyMenuService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMenuServiceVariant" ADD CONSTRAINT "DailyMenuServiceVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

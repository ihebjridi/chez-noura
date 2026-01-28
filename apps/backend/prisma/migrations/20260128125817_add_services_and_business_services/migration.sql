-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePack" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessService" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessServicePack" (
    "id" TEXT NOT NULL,
    "businessServiceId" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessServicePack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePack_packId_key" ON "ServicePack"("packId");

-- CreateIndex
CREATE INDEX "ServicePack_serviceId_idx" ON "ServicePack"("serviceId");

-- CreateIndex
CREATE INDEX "ServicePack_packId_idx" ON "ServicePack"("packId");

-- CreateIndex
CREATE INDEX "BusinessService_businessId_idx" ON "BusinessService"("businessId");

-- CreateIndex
CREATE INDEX "BusinessService_serviceId_idx" ON "BusinessService"("serviceId");

-- CreateIndex
CREATE INDEX "BusinessService_isActive_idx" ON "BusinessService"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessService_businessId_serviceId_key" ON "BusinessService"("businessId", "serviceId");

-- CreateIndex
CREATE INDEX "BusinessServicePack_businessServiceId_idx" ON "BusinessServicePack"("businessServiceId");

-- CreateIndex
CREATE INDEX "BusinessServicePack_packId_idx" ON "BusinessServicePack"("packId");

-- CreateIndex
CREATE INDEX "BusinessServicePack_isActive_idx" ON "BusinessServicePack"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessServicePack_businessServiceId_packId_key" ON "BusinessServicePack"("businessServiceId", "packId");

-- AddForeignKey
ALTER TABLE "ServicePack" ADD CONSTRAINT "ServicePack_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePack" ADD CONSTRAINT "ServicePack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessService" ADD CONSTRAINT "BusinessService_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessService" ADD CONSTRAINT "BusinessService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessServicePack" ADD CONSTRAINT "BusinessServicePack_businessServiceId_fkey" FOREIGN KEY ("businessServiceId") REFERENCES "BusinessService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessServicePack" ADD CONSTRAINT "BusinessServicePack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

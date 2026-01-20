-- CreateEnum for new models (if needed, but enums are already defined)
-- No new enums needed

-- Create Pack table
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- Create Component table
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- Create PackComponent table
CREATE TABLE "PackComponent" (
    "id" TEXT NOT NULL,
    "packId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackComponent_pkey" PRIMARY KEY ("id")
);

-- Create Variant table
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "Pack_name_key" ON "Pack"("name");
CREATE UNIQUE INDEX "Component_name_key" ON "Component"("name");
CREATE UNIQUE INDEX "PackComponent_packId_componentId_key" ON "PackComponent"("packId", "componentId");
CREATE UNIQUE INDEX "Variant_componentId_name_key" ON "Variant"("componentId", "name");

-- Create indexes
CREATE INDEX "Pack_isActive_idx" ON "Pack"("isActive");
CREATE INDEX "Pack_name_idx" ON "Pack"("name");
CREATE INDEX "PackComponent_packId_idx" ON "PackComponent"("packId");
CREATE INDEX "PackComponent_componentId_idx" ON "PackComponent"("componentId");
CREATE INDEX "Variant_componentId_idx" ON "Variant"("componentId");
CREATE INDEX "Variant_stockQuantity_idx" ON "Variant"("stockQuantity");
CREATE INDEX "Variant_isActive_idx" ON "Variant"("isActive");

-- Add foreign keys for PackComponent
ALTER TABLE "PackComponent" ADD CONSTRAINT "PackComponent_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PackComponent" ADD CONSTRAINT "PackComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for Variant
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 1: Handle existing Order data
-- Delete incompatible orders since they're meal-based and cannot be migrated to pack-based system
-- This is a breaking change - old orders are incompatible with the new pack-based structure
DELETE FROM "OrderItem";
DELETE FROM "Order";

-- Step 2: Add new columns as nullable first (to avoid constraint issues)
ALTER TABLE "Order" ADD COLUMN "packId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "componentId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;
-- mealId may already exist, so we check first
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='OrderItem' AND column_name='mealId') THEN
        ALTER TABLE "OrderItem" ADD COLUMN "mealId" TEXT;
    END IF;
END $$;

-- Step 3: Drop old columns from OrderItem that are no longer needed
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "quantity";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "unitPrice";

-- Step 4: Add foreign key constraints (check if they exist first)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_packId_fkey') THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_componentId_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_variantId_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_mealId_fkey') THEN
        ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 5: Add indexes
CREATE INDEX "Order_packId_idx" ON "Order"("packId");
CREATE INDEX "OrderItem_componentId_idx" ON "OrderItem"("componentId");
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- Step 6: Add unique constraint for OrderItem (one variant per component per order)
-- This will fail if there are duplicates, but we deleted all data so it's safe
CREATE UNIQUE INDEX "OrderItem_orderId_componentId_key" ON "OrderItem"("orderId", "componentId");

-- Step 7: Now make columns required (safe since we deleted all old data)
ALTER TABLE "Order" ALTER COLUMN "packId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "componentId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "variantId" SET NOT NULL;
-- mealId remains nullable for potential future use

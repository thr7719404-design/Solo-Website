-- CreateTable
CREATE TABLE "product_overrides" (
    "id" TEXT NOT NULL,
    "inventorySku" TEXT NOT NULL,
    "inventoryId" INTEGER,
    "isFeatured" BOOLEAN,
    "isNew" BOOLEAN,
    "isBestSeller" BOOLEAN,
    "homepageRank" INTEGER,
    "categoryRank" INTEGER,
    "customPrice" DECIMAL(10,2),
    "customSalePrice" DECIMAL(10,2),
    "customPriceInclVat" DECIMAL(10,2),
    "customImagesJson" TEXT,
    "customDescription" TEXT,
    "customLongDescription" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "product_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_overrides_inventorySku_key" ON "product_overrides"("inventorySku");

-- CreateIndex
CREATE INDEX "product_overrides_inventorySku_idx" ON "product_overrides"("inventorySku");

-- CreateIndex
CREATE INDEX "product_overrides_inventoryId_idx" ON "product_overrides"("inventoryId");

-- CreateIndex
CREATE INDEX "product_overrides_isFeatured_idx" ON "product_overrides"("isFeatured");

-- CreateIndex
CREATE INDEX "product_overrides_isNew_idx" ON "product_overrides"("isNew");

-- CreateIndex
CREATE INDEX "product_overrides_isBestSeller_idx" ON "product_overrides"("isBestSeller");

-- CreateIndex
CREATE INDEX "product_overrides_homepageRank_idx" ON "product_overrides"("homepageRank");

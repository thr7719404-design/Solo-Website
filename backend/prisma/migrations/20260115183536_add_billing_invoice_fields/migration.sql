-- CreateEnum
CREATE TYPE "public"."HomeSectionType" AS ENUM ('HERO_SLIDER', 'CATEGORY_TILES', 'NEW_ARRIVALS', 'TOP_SELLERS', 'BRAND_STRIP', 'LOYALTY_BANNER', 'PROMO_BANNER');

-- CreateEnum
CREATE TYPE "public"."CategoryLandingSectionType" AS ENUM ('SUBCATEGORY_NAV', 'PRODUCT_GRID', 'FEATURED_COLLECTIONS', 'NEW_ARRIVALS', 'TOP_SELLERS', 'BRAND_STRIP', 'PROMO_BANNER', 'SEO_FAQ', 'LOYALTY_BANNER');

-- AlterTable
ALTER TABLE "inventory"."products" ADD COLUMN     "delivery_note" VARCHAR(500),
ADD COLUMN     "full_description" TEXT,
ADD COLUMN     "gallery_image_urls" JSONB DEFAULT '[]',
ADD COLUMN     "highlights" JSONB DEFAULT '[]',
ADD COLUMN     "meta_description" VARCHAR(500),
ADD COLUMN     "meta_title" VARCHAR(200),
ADD COLUMN     "returns_note" VARCHAR(500),
ADD COLUMN     "short_description" VARCHAR(500),
ADD COLUMN     "specs" JSONB DEFAULT '[]',
ADD COLUMN     "url_slug" VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "billingInvoiceCompany" VARCHAR(60),
ADD COLUMN     "billingInvoiceVatNumber" VARCHAR(60);

-- CreateTable
CREATE TABLE "public"."home_page_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'home',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."home_page_sections" (
    "id" TEXT NOT NULL,
    "homePageId" TEXT NOT NULL,
    "type" "public"."HomeSectionType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "position" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_landing_page_configs" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroImageUrl" TEXT,
    "heroImageMobileUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaTargetType" TEXT,
    "ctaTargetValue" TEXT,
    "isHeroEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_landing_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_landing_sections" (
    "id" TEXT NOT NULL,
    "landingId" TEXT NOT NULL,
    "type" "public"."CategoryLandingSectionType" NOT NULL,
    "title" TEXT,
    "position" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_landing_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_page_configs_key_key" ON "public"."home_page_configs"("key");

-- CreateIndex
CREATE INDEX "home_page_sections_homePageId_idx" ON "public"."home_page_sections"("homePageId");

-- CreateIndex
CREATE INDEX "home_page_sections_position_idx" ON "public"."home_page_sections"("position");

-- CreateIndex
CREATE INDEX "home_page_sections_isEnabled_idx" ON "public"."home_page_sections"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "category_landing_page_configs_categoryId_key" ON "public"."category_landing_page_configs"("categoryId");

-- CreateIndex
CREATE INDEX "category_landing_page_configs_categoryId_idx" ON "public"."category_landing_page_configs"("categoryId");

-- CreateIndex
CREATE INDEX "category_landing_page_configs_isHeroEnabled_idx" ON "public"."category_landing_page_configs"("isHeroEnabled");

-- CreateIndex
CREATE INDEX "category_landing_sections_landingId_idx" ON "public"."category_landing_sections"("landingId");

-- CreateIndex
CREATE INDEX "category_landing_sections_position_idx" ON "public"."category_landing_sections"("position");

-- CreateIndex
CREATE INDEX "category_landing_sections_isEnabled_idx" ON "public"."category_landing_sections"("isEnabled");

-- AddForeignKey
ALTER TABLE "public"."home_page_sections" ADD CONSTRAINT "home_page_sections_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "public"."home_page_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_landing_sections" ADD CONSTRAINT "category_landing_sections_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "public"."category_landing_page_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

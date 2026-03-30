/*
  Warnings:

  - You are about to drop the column `endsAt` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `linkText` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `linkUrl` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `mobileImage` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `banners` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('HOME_HERO', 'HOME_MID', 'CATEGORY_TOP', 'CATEGORY_MID', 'PRODUCT_SIDEBAR', 'CHECKOUT_TOP', 'HOME_SECONDARY', 'CATEGORY', 'PROMOTION');

-- CreateEnum
CREATE TYPE "LandingSectionType" AS ENUM ('PRODUCT_GRID', 'CATEGORY_GRID', 'RICH_TEXT', 'IMAGE', 'BANNER_CAROUSEL');

-- DropIndex
DROP INDEX "banners_sortOrder_idx";

-- DropIndex
DROP INDEX "banners_type_idx";

-- AlterTable
ALTER TABLE "banners" DROP COLUMN "endsAt",
DROP COLUMN "image",
DROP COLUMN "linkText",
DROP COLUMN "linkUrl",
DROP COLUMN "mobileImage",
DROP COLUMN "sortOrder",
DROP COLUMN "startsAt",
DROP COLUMN "type",
ADD COLUMN     "ctaText" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "imageDesktopUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "imageMobileUrl" TEXT,
ADD COLUMN     "placement" "BannerPlacement" NOT NULL DEFAULT 'HOME_HERO',
ADD COLUMN     "startAt" TIMESTAMP(3);

-- DropEnum
DROP TYPE "BannerType";

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "heroBannerId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_sections" (
    "id" TEXT NOT NULL,
    "landingPageId" TEXT NOT NULL,
    "type" "LandingSectionType" NOT NULL,
    "data" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_slug_idx" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_isActive_idx" ON "landing_pages"("isActive");

-- CreateIndex
CREATE INDEX "landing_sections_landingPageId_idx" ON "landing_sections"("landingPageId");

-- CreateIndex
CREATE INDEX "landing_sections_displayOrder_idx" ON "landing_sections"("displayOrder");

-- CreateIndex
CREATE INDEX "landing_sections_isActive_idx" ON "landing_sections"("isActive");

-- CreateIndex
CREATE INDEX "banners_placement_idx" ON "banners"("placement");

-- CreateIndex
CREATE INDEX "banners_displayOrder_idx" ON "banners"("displayOrder");

-- CreateIndex
CREATE INDEX "banners_startAt_idx" ON "banners"("startAt");

-- CreateIndex
CREATE INDEX "banners_endAt_idx" ON "banners"("endAt");

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_heroBannerId_fkey" FOREIGN KEY ("heroBannerId") REFERENCES "banners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_sections" ADD CONSTRAINT "landing_sections_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "landing_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

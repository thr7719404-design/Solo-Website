-- CreateEnum
CREATE TYPE "public"."ProductCollectionStrategy" AS ENUM ('NEWEST', 'BEST_SELLING', 'FEATURED', 'MANUAL', 'CATEGORY_FILTER', 'BRAND_FILTER', 'TAG_FILTER', 'PRICE_RANGE', 'ON_SALE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LandingSectionType" ADD VALUE 'TOP_PROMO_BAR';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'TOP_LINKS_BAR';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'MAIN_HEADER';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'PRIMARY_NAV';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'HERO_SLIDER';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'VALUE_PROPS_ROW';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'PROMO_BANNER_ROW_3';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'PRODUCT_COLLECTION';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'SALE_STRIP_BANNER';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'CATEGORY_CIRCLE_STRIP';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'INFO_BLOCKS_3';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'BLOG_LATEST_GRID';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'BRAND_LOGO_STRIP';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'FOOTER_CONFIG';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'NEWSLETTER_BLOCK';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'TESTIMONIALS';

-- AlterTable
ALTER TABLE "public"."brands" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."navigation_menus" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."navigation_menu_items" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "icon" TEXT,
    "badge" TEXT,
    "badgeColor" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_posts" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "author" TEXT,
    "readTimeMinutes" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_post_tags" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_collections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "strategy" "public"."ProductCollectionStrategy" NOT NULL DEFAULT 'MANUAL',
    "ruleJson" TEXT,
    "limit" INTEGER NOT NULL DEFAULT 12,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "navigation_menus_key_key" ON "public"."navigation_menus"("key");

-- CreateIndex
CREATE INDEX "navigation_menus_key_idx" ON "public"."navigation_menus"("key");

-- CreateIndex
CREATE INDEX "navigation_menus_isActive_idx" ON "public"."navigation_menus"("isActive");

-- CreateIndex
CREATE INDEX "navigation_menu_items_menuId_idx" ON "public"."navigation_menu_items"("menuId");

-- CreateIndex
CREATE INDEX "navigation_menu_items_parentId_idx" ON "public"."navigation_menu_items"("parentId");

-- CreateIndex
CREATE INDEX "navigation_menu_items_sortOrder_idx" ON "public"."navigation_menu_items"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_name_key" ON "public"."blog_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "public"."blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_categories_slug_idx" ON "public"."blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_categories_isActive_idx" ON "public"."blog_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_name_key" ON "public"."blog_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "public"."blog_tags"("slug");

-- CreateIndex
CREATE INDEX "blog_tags_slug_idx" ON "public"."blog_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "public"."blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "public"."blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_categoryId_idx" ON "public"."blog_posts"("categoryId");

-- CreateIndex
CREATE INDEX "blog_posts_isActive_idx" ON "public"."blog_posts"("isActive");

-- CreateIndex
CREATE INDEX "blog_posts_publishedAt_idx" ON "public"."blog_posts"("publishedAt");

-- CreateIndex
CREATE INDEX "blog_posts_isFeatured_idx" ON "public"."blog_posts"("isFeatured");

-- CreateIndex
CREATE INDEX "blog_post_tags_postId_idx" ON "public"."blog_post_tags"("postId");

-- CreateIndex
CREATE INDEX "blog_post_tags_tagId_idx" ON "public"."blog_post_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_tags_postId_tagId_key" ON "public"."blog_post_tags"("postId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collections_key_key" ON "public"."product_collections"("key");

-- CreateIndex
CREATE INDEX "product_collections_key_idx" ON "public"."product_collections"("key");

-- CreateIndex
CREATE INDEX "product_collections_isActive_idx" ON "public"."product_collections"("isActive");

-- CreateIndex
CREATE INDEX "product_collection_items_collectionId_idx" ON "public"."product_collection_items"("collectionId");

-- CreateIndex
CREATE INDEX "product_collection_items_productId_idx" ON "public"."product_collection_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_collection_items_collectionId_productId_key" ON "public"."product_collection_items"("collectionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "public"."site_settings"("key");

-- CreateIndex
CREATE INDEX "site_settings_key_idx" ON "public"."site_settings"("key");

-- CreateIndex
CREATE INDEX "site_settings_group_idx" ON "public"."site_settings"("group");

-- CreateIndex
CREATE INDEX "brands_sortOrder_idx" ON "public"."brands"("sortOrder");

-- AddForeignKey
ALTER TABLE "public"."navigation_menu_items" ADD CONSTRAINT "navigation_menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "public"."navigation_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."navigation_menu_items" ADD CONSTRAINT "navigation_menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."navigation_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."blog_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blog_post_tags" ADD CONSTRAINT "blog_post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blog_post_tags" ADD CONSTRAINT "blog_post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_collection_items" ADD CONSTRAINT "product_collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."product_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

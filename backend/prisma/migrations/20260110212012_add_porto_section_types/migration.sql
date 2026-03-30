/*
  Warnings:

  - You are about to drop the column `company` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `addresses` table. All the data in the column will be lost.
  - The `productId` column on the `analytics_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `productId` column on the `cart_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `productId` column on the `order_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentMethod` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `product_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `productId` on the `package_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "inventory";

-- CreateEnum
CREATE TYPE "public"."LoyaltyTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'ADJUSTMENT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CREDIT_CARD', 'CASH_ON_DELIVERY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LandingSectionType" ADD VALUE 'HERO';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'CATEGORY_TILES';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'PRODUCT_CAROUSEL';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'BRAND_STRIP';
ALTER TYPE "public"."LandingSectionType" ADD VALUE 'PROMO_BANNER';

-- DropForeignKey
ALTER TABLE "public"."analytics_events" DROP CONSTRAINT "analytics_events_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cart_items" DROP CONSTRAINT "cart_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."package_items" DROP CONSTRAINT "package_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_images" DROP CONSTRAINT "product_images_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_brandId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_departmentId_fkey";

-- AlterTable
ALTER TABLE "public"."addresses" DROP COLUMN "company",
DROP COLUMN "country",
DROP COLUMN "state",
ADD COLUMN     "label" TEXT,
ALTER COLUMN "postalCode" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."analytics_events" DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER;

-- AlterTable
ALTER TABLE "public"."cart_items" DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER;

-- AlterTable
ALTER TABLE "public"."landing_sections" ADD COLUMN     "config" TEXT,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "public"."order_items" DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER;

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'CREDIT_CARD';

-- AlterTable
ALTER TABLE "public"."package_items" DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."product_images";

-- DropTable
DROP TABLE "public"."products";

-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_verification_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loyalty_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceAed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarnedAed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalRedeemedAed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loyalty_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "public"."LoyaltyTransactionType" NOT NULL,
    "amountAed" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."saved_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "providerPaymentMethodId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last4" VARCHAR(4) NOT NULL,
    "expMonth" INTEGER NOT NULL,
    "expYear" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."countries" (
    "id" SERIAL NOT NULL,
    "country_code" VARCHAR(3) NOT NULL,
    "country_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."brands" (
    "id" SERIAL NOT NULL,
    "brand_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "website" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."designers" (
    "id" SERIAL NOT NULL,
    "designer_name" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."categories" (
    "id" SERIAL NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."subcategories" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "subcategory_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."products" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "sku_2025" VARCHAR(50),
    "sku_2026" VARCHAR(50),
    "name" VARCHAR(255) NOT NULL,
    "name_english" VARCHAR(255),
    "description" TEXT,
    "category_id" INTEGER,
    "subcategory_id" INTEGER,
    "brand_id" INTEGER,
    "designer_id" INTEGER,
    "country_id" INTEGER,
    "material" VARCHAR(255),
    "colour" VARCHAR(100),
    "size" VARCHAR(50),
    "ean" BIGINT,
    "ean_secondary" BIGINT,
    "customs_tariff_number" BIGINT,
    "dishwasher_safe" BOOLEAN,
    "cleaning_maintenance" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_discontinued" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "is_best_seller" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."product_dimensions" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "functional_depth_cm" DECIMAL(10,2),
    "functional_width_cm" DECIMAL(10,2),
    "functional_height_cm" DECIMAL(10,2),
    "functional_diameter_cm" DECIMAL(10,2),
    "functional_capacity_liter" DECIMAL(10,3),
    "packed_weight_kg" DECIMAL(10,3),
    "packed_depth_cm" DECIMAL(10,2),
    "packed_width_cm" DECIMAL(10,2),
    "packed_height_cm" DECIMAL(10,2),
    "product_weight_kg" DECIMAL(10,3),
    "technical_capacity_liter" DECIMAL(10,3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."product_packaging" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "packaging_type" VARCHAR(100),
    "colli_size" INTEGER,
    "colli_weight_kg" DECIMAL(10,3),
    "colli_length_cm" DECIMAL(10,2),
    "colli_width_cm" DECIMAL(10,2),
    "colli_height_cm" DECIMAL(10,2),
    "master_colli_weight_kg" DECIMAL(10,3),
    "master_colli_length_cm" DECIMAL(10,2),
    "master_colli_width_cm" DECIMAL(10,2),
    "master_colli_height_cm" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_packaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."product_pricing" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "rrp_aed_excl_vat" DECIMAL(10,2),
    "price_incl_vat" DECIMAL(10,2),
    "listed_price_incl_vat" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'AED',
    "vat_rate" DECIMAL(5,2),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" DATE,
    "effective_to" DATE,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."product_images" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "image_type" VARCHAR(50),
    "alt_text" VARCHAR(255),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."product_specifications" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "spec_key" VARCHAR(100) NOT NULL,
    "spec_value" TEXT,
    "spec_unit" VARCHAR(50),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory"."inventory_transactions" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_before" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "reference" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "public"."password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "public"."password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "public"."password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "public"."email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_tokenHash_idx" ON "public"."email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "public"."email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_wallets_userId_key" ON "public"."loyalty_wallets"("userId");

-- CreateIndex
CREATE INDEX "loyalty_wallets_userId_idx" ON "public"."loyalty_wallets"("userId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_walletId_idx" ON "public"."loyalty_transactions"("walletId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_orderId_idx" ON "public"."loyalty_transactions"("orderId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_createdAt_idx" ON "public"."loyalty_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "saved_payment_methods_userId_idx" ON "public"."saved_payment_methods"("userId");

-- CreateIndex
CREATE INDEX "saved_payment_methods_isDefault_idx" ON "public"."saved_payment_methods"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_code_key" ON "inventory"."countries"("country_code");

-- CreateIndex
CREATE INDEX "countries_country_code_idx" ON "inventory"."countries"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brand_name_key" ON "inventory"."brands"("brand_name");

-- CreateIndex
CREATE INDEX "brands_brand_name_idx" ON "inventory"."brands"("brand_name");

-- CreateIndex
CREATE INDEX "brands_is_active_idx" ON "inventory"."brands"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "designers_designer_name_key" ON "inventory"."designers"("designer_name");

-- CreateIndex
CREATE INDEX "designers_designer_name_idx" ON "inventory"."designers"("designer_name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_category_name_key" ON "inventory"."categories"("category_name");

-- CreateIndex
CREATE INDEX "categories_category_name_idx" ON "inventory"."categories"("category_name");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "inventory"."categories"("is_active");

-- CreateIndex
CREATE INDEX "subcategories_category_id_idx" ON "inventory"."subcategories"("category_id");

-- CreateIndex
CREATE INDEX "subcategories_subcategory_name_idx" ON "inventory"."subcategories"("subcategory_name");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_category_id_subcategory_name_key" ON "inventory"."subcategories"("category_id", "subcategory_name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "inventory"."products"("sku");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "inventory"."products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "inventory"."products"("category_id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "inventory"."products"("brand_id");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "inventory"."products"("is_active");

-- CreateIndex
CREATE INDEX "products_is_featured_idx" ON "inventory"."products"("is_featured");

-- CreateIndex
CREATE INDEX "products_is_new_idx" ON "inventory"."products"("is_new");

-- CreateIndex
CREATE INDEX "products_is_best_seller_idx" ON "inventory"."products"("is_best_seller");

-- CreateIndex
CREATE UNIQUE INDEX "product_dimensions_product_id_key" ON "inventory"."product_dimensions"("product_id");

-- CreateIndex
CREATE INDEX "product_dimensions_product_id_idx" ON "inventory"."product_dimensions"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_packaging_product_id_key" ON "inventory"."product_packaging"("product_id");

-- CreateIndex
CREATE INDEX "product_packaging_product_id_idx" ON "inventory"."product_packaging"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_pricing_product_id_key" ON "inventory"."product_pricing"("product_id");

-- CreateIndex
CREATE INDEX "product_pricing_product_id_idx" ON "inventory"."product_pricing"("product_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "inventory"."product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_images_display_order_idx" ON "inventory"."product_images"("display_order");

-- CreateIndex
CREATE INDEX "product_specifications_product_id_idx" ON "inventory"."product_specifications"("product_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_product_id_idx" ON "inventory"."inventory_transactions"("product_id");

-- CreateIndex
CREATE INDEX "inventory_transactions_transaction_type_idx" ON "inventory"."inventory_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "inventory_transactions_created_at_idx" ON "inventory"."inventory_transactions"("created_at");

-- CreateIndex
CREATE INDEX "analytics_events_productId_idx" ON "public"."analytics_events"("productId");

-- CreateIndex
CREATE INDEX "cart_items_productId_idx" ON "public"."cart_items"("productId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "public"."order_items"("productId");

-- CreateIndex
CREATE INDEX "package_items_productId_idx" ON "public"."package_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "package_items_packageId_productId_key" ON "public"."package_items"("packageId", "productId");

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty_wallets" ADD CONSTRAINT "loyalty_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."loyalty_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_payment_methods" ADD CONSTRAINT "saved_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "inventory"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "inventory"."subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "inventory"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "inventory"."designers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."products" ADD CONSTRAINT "products_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "inventory"."countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."product_dimensions" ADD CONSTRAINT "product_dimensions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."product_packaging" ADD CONSTRAINT "product_packaging_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."product_pricing" ADD CONSTRAINT "product_pricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."product_specifications" ADD CONSTRAINT "product_specifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory"."inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

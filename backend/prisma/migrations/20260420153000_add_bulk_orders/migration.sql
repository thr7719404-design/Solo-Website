-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BulkOrderStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "bulk_order_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_number" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "country_code" TEXT NOT NULL DEFAULT '+971',
  "status" "BulkOrderStatus" NOT NULL DEFAULT 'NEW',
  "admin_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bulk_order_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "bulk_order_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "bulk_order_id" UUID NOT NULL,
  "product_id" INTEGER NOT NULL,
  "product_name" TEXT NOT NULL,
  "sku" TEXT,
  "quantity" INTEGER NOT NULL,

  CONSTRAINT "bulk_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bulk_order_requests_order_number_key" ON "bulk_order_requests"("order_number");
CREATE INDEX IF NOT EXISTS "bulk_order_requests_status_idx" ON "bulk_order_requests"("status");
CREATE INDEX IF NOT EXISTS "bulk_order_requests_created_at_idx" ON "bulk_order_requests"("created_at");
CREATE INDEX IF NOT EXISTS "bulk_order_requests_email_idx" ON "bulk_order_requests"("email");
CREATE INDEX IF NOT EXISTS "bulk_order_items_bulk_order_id_idx" ON "bulk_order_items"("bulk_order_id");
CREATE INDEX IF NOT EXISTS "bulk_order_items_product_id_idx" ON "bulk_order_items"("product_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "bulk_order_items"
    ADD CONSTRAINT "bulk_order_items_bulk_order_id_fkey"
    FOREIGN KEY ("bulk_order_id") REFERENCES "bulk_order_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
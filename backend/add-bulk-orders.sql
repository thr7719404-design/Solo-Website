-- Create BulkOrderStatus enum
DO $$ BEGIN
  CREATE TYPE "BulkOrderStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create bulk_order_requests table
CREATE TABLE IF NOT EXISTS "bulk_order_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50) NOT NULL,
  "country_code" VARCHAR(10) NOT NULL DEFAULT '+971',
  "status" "BulkOrderStatus" NOT NULL DEFAULT 'NEW',
  "admin_notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bulk_order_items table
CREATE TABLE IF NOT EXISTS "bulk_order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bulk_order_id" UUID NOT NULL REFERENCES "bulk_order_requests"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL,
  "product_name" VARCHAR(255) NOT NULL,
  "sku" VARCHAR(50),
  "quantity" INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_bulk_order_requests_status" ON "bulk_order_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_bulk_order_requests_created_at" ON "bulk_order_requests"("created_at");
CREATE INDEX IF NOT EXISTS "idx_bulk_order_requests_email" ON "bulk_order_requests"("email");
CREATE INDEX IF NOT EXISTS "idx_bulk_order_items_bulk_order_id" ON "bulk_order_items"("bulk_order_id");
CREATE INDEX IF NOT EXISTS "idx_bulk_order_items_product_id" ON "bulk_order_items"("product_id");

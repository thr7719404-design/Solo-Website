-- Add address snapshot columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "shippingAddressSnapshot" JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "billingAddressSnapshot" JSONB;

-- Backfill snapshots from the existing linked address rows
UPDATE orders o
SET "shippingAddressSnapshot" = (
  SELECT to_jsonb(a) FROM addresses a WHERE a.id = o."shippingAddressId"
)
WHERE o."shippingAddressSnapshot" IS NULL AND o."shippingAddressId" IS NOT NULL;

UPDATE orders o
SET "billingAddressSnapshot" = (
  SELECT to_jsonb(a) FROM addresses a WHERE a.id = o."billingAddressId"
)
WHERE o."billingAddressSnapshot" IS NULL AND o."billingAddressId" IS NOT NULL;

-- Drop FK constraints so addresses can be deleted freely
ALTER TABLE orders DROP CONSTRAINT IF EXISTS "orders_shippingAddressId_fkey";
ALTER TABLE orders DROP CONSTRAINT IF EXISTS "orders_billingAddressId_fkey";

-- Make address ID columns nullable
ALTER TABLE orders ALTER COLUMN "shippingAddressId" DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN "billingAddressId" DROP NOT NULL;

-- Soft-delete support for products. A non-null deleted_at marks the product
-- as removed from the catalog while preserving the row (and all historical
-- order_item references) so sales reconciliation stays accurate.
ALTER TABLE "products" ADD COLUMN "deleted_at" TIMESTAMP(6);
CREATE INDEX "idx_products_deleted_at" ON "products"("deleted_at");

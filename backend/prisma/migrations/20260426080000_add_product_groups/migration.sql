-- CreateTable: product_groups
CREATE TABLE "product_groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "variant_axes" JSONB NOT NULL DEFAULT '["color"]',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- AlterTable: products — add variant linkage
ALTER TABLE "products"
    ADD COLUMN "product_group_id" UUID,
    ADD COLUMN "variant_attributes" JSONB,
    ADD COLUMN "variant_sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "idx_products_product_group_id" ON "products"("product_group_id");

-- AddForeignKey
ALTER TABLE "products"
    ADD CONSTRAINT "products_product_group_id_fkey"
    FOREIGN KEY ("product_group_id") REFERENCES "product_groups"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;

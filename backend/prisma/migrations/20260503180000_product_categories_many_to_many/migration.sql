-- Many-to-many: products ↔ categories and products ↔ subcategories
-- Legacy single-FK columns (products.category_id, products.subcategory_id)
-- are kept as the "primary" assignment for back-compat.

CREATE TABLE IF NOT EXISTS "product_categories" (
    "product_id"  INTEGER     NOT NULL,
    "category_id" INTEGER     NOT NULL,
    "created_at"  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id", "category_id"),
    CONSTRAINT "product_categories_product_id_fkey"
        FOREIGN KEY ("product_id")  REFERENCES "products"("id")    ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "product_categories_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "categories"("id")  ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "idx_product_categories_category_id" ON "product_categories"("category_id");
CREATE INDEX IF NOT EXISTS "idx_product_categories_product_id"  ON "product_categories"("product_id");

CREATE TABLE IF NOT EXISTS "product_subcategories" (
    "product_id"     INTEGER     NOT NULL,
    "subcategory_id" INTEGER     NOT NULL,
    "created_at"     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_subcategories_pkey" PRIMARY KEY ("product_id", "subcategory_id"),
    CONSTRAINT "product_subcategories_product_id_fkey"
        FOREIGN KEY ("product_id")     REFERENCES "products"("id")       ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "product_subcategories_subcategory_id_fkey"
        FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id")  ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "idx_product_subcategories_subcategory_id" ON "product_subcategories"("subcategory_id");
CREATE INDEX IF NOT EXISTS "idx_product_subcategories_product_id"     ON "product_subcategories"("product_id");

-- Backfill: copy each existing single-FK assignment into the join tables
INSERT INTO "product_categories" ("product_id", "category_id")
SELECT "id", "category_id"
FROM "products"
WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "product_subcategories" ("product_id", "subcategory_id")
SELECT "id", "subcategory_id"
FROM "products"
WHERE "subcategory_id" IS NOT NULL
ON CONFLICT DO NOTHING;

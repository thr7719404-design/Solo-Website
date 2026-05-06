-- =====================================================================
-- Variants Architecture v2: ProductGroup metadata + VariantAttribute table
-- Idempotent / safe to re-run
-- =====================================================================

-- 1) ProductGroup: new optional metadata columns
ALTER TABLE product_groups
  ADD COLUMN IF NOT EXISTS slug        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags        TEXT[] NOT NULL DEFAULT '{}';

-- 2) Backfill slug from name (slugify) where NULL
UPDATE product_groups
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE slug IS NULL;

-- 3) Resolve any duplicate slugs by appending the short id
UPDATE product_groups pg
SET slug = pg.slug || '-' || SUBSTRING(pg.id::text, 1, 8)
WHERE pg.id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
    FROM product_groups
  ) s WHERE s.rn > 1
);

-- 4) Make slug NOT NULL + unique
ALTER TABLE product_groups
  ALTER COLUMN slug SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'product_groups_slug_key'
  ) THEN
    CREATE UNIQUE INDEX product_groups_slug_key ON product_groups(slug);
  END IF;
END $$;

-- 5) Product: is_default_variant flag
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_default_variant BOOLEAN NOT NULL DEFAULT FALSE;

-- 6) variant_attributes table
CREATE TABLE IF NOT EXISTS variant_attributes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL,
  key        VARCHAR(50)  NOT NULL,
  value      VARCHAR(255) NOT NULL,
  color_hex  VARCHAR(20),
  CONSTRAINT variant_attributes_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_variant_attributes_product_key
  ON variant_attributes(product_id, key);
CREATE INDEX IF NOT EXISTS idx_variant_attributes_product_id
  ON variant_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_attributes_key_value
  ON variant_attributes(key, value);

-- 7) Backfill variant_attributes from existing products.variant_attributes JSON
--    JSON shape today: { colorName?, color?, colorHex?, size?, ... }
--    Any other key -> stored as-is with key=lower(jsonkey).
--    Only runs for products that have JSON but no relational rows yet.
INSERT INTO variant_attributes (product_id, key, value, color_hex)
SELECT
  p.id,
  LOWER(j.key) AS attr_key,
  j.value::text AS attr_value,
  CASE WHEN LOWER(j.key) IN ('color', 'colorname')
       THEN p.variant_attributes->>'colorHex'
       ELSE NULL END AS color_hex
FROM products p,
     LATERAL jsonb_each_text(p.variant_attributes) AS j(key, value)
WHERE p.variant_attributes IS NOT NULL
  AND p.variant_attributes <> '{}'::jsonb
  AND LOWER(j.key) NOT IN ('colorhex')   -- skip hex-only entries; merged above
  AND j.value IS NOT NULL
  AND j.value <> ''
  AND NOT EXISTS (
    SELECT 1 FROM variant_attributes va
    WHERE va.product_id = p.id AND va.key = LOWER(j.key)
  )
-- Normalize: if both 'color' and 'colorname' exist, prefer 'color'
ON CONFLICT (product_id, key) DO NOTHING;

-- 8) Auto-default: for each group, mark the lowest variant_sort_order as default
--    (only if no default is set yet for that group)
WITH ranked AS (
  SELECT
    p.id,
    p.product_group_id,
    ROW_NUMBER() OVER (
      PARTITION BY p.product_group_id
      ORDER BY p.variant_sort_order ASC, p.id ASC
    ) AS rn
  FROM products p
  WHERE p.product_group_id IS NOT NULL
)
UPDATE products SET is_default_variant = TRUE
WHERE id IN (
  SELECT r.id FROM ranked r
  WHERE r.rn = 1
    AND NOT EXISTS (
      SELECT 1 FROM products p2
      WHERE p2.product_group_id = r.product_group_id
        AND p2.is_default_variant = TRUE
    )
);

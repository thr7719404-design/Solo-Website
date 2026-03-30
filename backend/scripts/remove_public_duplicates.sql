-- ============================================================
-- Remove duplicate tables from public schema
-- Keep only inventory schema versions
-- ============================================================

BEGIN;

-- First, check what foreign keys reference these tables
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '=== Foreign keys referencing public.products ===';
    FOR fk_record IN 
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.referential_constraints rc 
            ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON rc.unique_constraint_name = ccu.constraint_name
        WHERE ccu.table_schema = 'public' 
            AND ccu.table_name IN ('products', 'brands', 'categories', 'product_images')
            AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE 'FK: %.% (%) -> constraint: %', 
            fk_record.table_schema, 
            fk_record.table_name, 
            fk_record.column_name,
            fk_record.constraint_name;
    END LOOP;
END $$;

-- ============================================================
-- Step 1: Drop foreign key constraints that reference public tables
-- ============================================================

-- Drop FKs from cart_items -> public.products
ALTER TABLE public.cart_items 
    DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

-- Drop FKs from order_items -> public.products
ALTER TABLE public.order_items 
    DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Drop FKs from product_overrides -> public.products
ALTER TABLE public.product_overrides 
    DROP CONSTRAINT IF EXISTS product_overrides_product_id_fkey;

-- Drop FKs from public.products -> public.brands
ALTER TABLE public.products 
    DROP CONSTRAINT IF EXISTS products_brand_id_fkey;

-- Drop FKs from public.products -> public.categories
ALTER TABLE public.products 
    DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Drop FKs from public.product_images -> public.products
ALTER TABLE public.product_images 
    DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;

-- ============================================================
-- Step 2: Drop the duplicate tables from public schema
-- ============================================================

DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ============================================================
-- Step 3: Recreate foreign keys pointing to inventory schema
-- (Using camelCase column names as per Prisma schema)
-- ============================================================

-- cart_items -> inventory.products
ALTER TABLE public.cart_items 
    ADD CONSTRAINT "cart_items_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES inventory.products(id) 
    ON DELETE CASCADE;

-- order_items -> inventory.products
ALTER TABLE public.order_items 
    ADD CONSTRAINT "order_items_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES inventory.products(id) 
    ON DELETE SET NULL;

-- package_items -> inventory.products
ALTER TABLE public.package_items 
    ADD CONSTRAINT "package_items_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES inventory.products(id) 
    ON DELETE CASCADE;

-- analytics_events -> inventory.products (nullable)
ALTER TABLE public.analytics_events 
    ADD CONSTRAINT "analytics_events_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES inventory.products(id) 
    ON DELETE SET NULL;

-- ============================================================
-- Step 4: Verify the changes
-- ============================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Check public schema no longer has duplicates
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name IN ('products', 'brands', 'categories', 'product_images')
        AND table_type = 'BASE TABLE';
    
    IF table_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All duplicate tables removed from public schema';
    ELSE
        RAISE EXCEPTION 'ERROR: % duplicate tables still exist in public schema', table_count;
    END IF;
    
    -- Verify inventory tables exist
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'inventory' 
        AND table_name IN ('products', 'brands', 'categories', 'product_images')
        AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Inventory schema has % of 4 expected tables', table_count;
END $$;

COMMIT;

-- Final summary
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'inventory') 
    AND table_name IN ('products', 'brands', 'categories', 'product_images')
    AND table_type = 'BASE TABLE'
ORDER BY table_name, table_schema;

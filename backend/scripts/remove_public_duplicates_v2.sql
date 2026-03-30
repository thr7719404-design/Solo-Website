-- ============================================================
-- Remove duplicate tables from public schema
-- Keep only inventory schema versions
-- 
-- NOTE: public tables use TEXT ids, inventory uses INTEGER ids
-- We cannot add FK constraints - just removing duplicates
-- ============================================================

BEGIN;

-- ============================================================
-- Step 1: Show what will be dropped
-- ============================================================

SELECT 'Tables to be DROPPED from public schema:' as info;
SELECT table_schema, table_name, 
       (SELECT COUNT(*) FROM information_schema.columns c 
        WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name IN ('products', 'brands', 'categories', 'product_images')
    AND table_type = 'BASE TABLE';

SELECT 'Tables to KEEP in inventory schema:' as info;
SELECT table_schema, table_name,
       (SELECT COUNT(*) FROM information_schema.columns c 
        WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'inventory' 
    AND table_name IN ('products', 'brands', 'categories', 'product_images')
    AND table_type = 'BASE TABLE';

-- ============================================================
-- Step 2: Drop duplicate tables from public schema (CASCADE)
-- ============================================================

-- This will also drop foreign key constraints that reference these tables
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ============================================================
-- Step 3: Verify the changes
-- ============================================================

DO $$
DECLARE
    public_count INTEGER;
    inventory_count INTEGER;
BEGIN
    -- Check public schema no longer has duplicates
    SELECT COUNT(*) INTO public_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name IN ('products', 'brands', 'categories', 'product_images')
        AND table_type = 'BASE TABLE';
    
    -- Check inventory tables exist
    SELECT COUNT(*) INTO inventory_count
    FROM information_schema.tables 
    WHERE table_schema = 'inventory' 
        AND table_name IN ('products', 'brands', 'categories', 'product_images')
        AND table_type = 'BASE TABLE';
    
    IF public_count = 0 AND inventory_count = 4 THEN
        RAISE NOTICE 'SUCCESS: Removed % public tables, kept % inventory tables', 4 - public_count, inventory_count;
    ELSIF public_count > 0 THEN
        RAISE EXCEPTION 'ERROR: % duplicate tables still exist in public schema', public_count;
    ELSE
        RAISE NOTICE 'WARNING: Only % of 4 expected tables in inventory schema', inventory_count;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- Final summary
-- ============================================================

SELECT 'FINAL STATE - Tables named products/brands/categories/product_images:' as summary;
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'inventory') 
    AND table_name IN ('products', 'brands', 'categories', 'product_images')
    AND table_type = 'BASE TABLE'
ORDER BY table_name, table_schema;

SELECT 'Foreign keys that were dropped (referencing old public tables):' as info;
-- These are gone now, application code must use inventory schema directly

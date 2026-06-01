-- Check if there's a media_assets table
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%media%';

-- Check for any remaining stsolowebsite references anywhere
SELECT 'product_images' as tbl, COUNT(*) FROM product_images WHERE media_asset_id LIKE '%stsolowebsite%'
UNION ALL SELECT 'products', COUNT(*) FROM products WHERE CAST(products::text AS TEXT) LIKE '%stsolowebsite%';

-- Sample UUID-only entries to understand what they reference
SELECT pi.id, pi.media_asset_id, pi.product_id FROM product_images WHERE media_asset_id NOT LIKE 'http%' LIMIT 5;

-- Count how many UNIQUE product UUIDs are in products/ storage path in DB
SELECT COUNT(DISTINCT media_asset_id) FROM product_images WHERE media_asset_id LIKE '%/products/%';

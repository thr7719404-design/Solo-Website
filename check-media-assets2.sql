-- Check if media_assets has any old storage URLs
SELECT COUNT(*) as old_urls FROM media_assets WHERE key LIKE '%stsolowebsite%' OR "filename" LIKE '%stsolowebsite%';

-- Check media_assets key format
SELECT id, key, folder FROM media_assets LIMIT 5;

-- Check if any media_assets urls field exists with old storage
SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='media_assets';

-- Count media_assets total
SELECT COUNT(*) FROM media_assets;

-- Check if the 21 products/ blobs in storage match any media_assets keys
SELECT COUNT(*) FROM media_assets WHERE key LIKE 'products/2026/%';
SELECT COUNT(*) FROM media_assets WHERE key LIKE 'products/%' AND key NOT LIKE 'products/2026/%';

-- Check media_assets table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='media_assets';

-- Sample media_assets
SELECT * FROM media_assets LIMIT 3;

-- UUID-only product_images entries
SELECT id, media_asset_id, product_id FROM product_images WHERE media_asset_id NOT LIKE 'http%' LIMIT 5;

-- Check if UUID-only entries match IDs in media_assets
SELECT COUNT(*) as matching FROM product_images pi 
JOIN media_assets ma ON pi.media_asset_id = ma.id::text
WHERE pi.media_asset_id NOT LIKE 'http%';

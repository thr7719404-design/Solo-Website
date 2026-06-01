-- Check products table image-related columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema='public' AND table_name='products' AND (column_name LIKE '%image%' OR column_name LIKE '%url%' OR column_name LIKE '%photo%' OR column_name LIKE '%media%')
ORDER BY column_name;

-- Search for one of the ERR_NAME_NOT_RESOLVED filenames across all text columns
SELECT 'product_images' as tbl, media_asset_id FROM product_images WHERE media_asset_id LIKE '%d9699832%' LIMIT 2;

-- Check what full URLs look like in product_images now
SELECT media_asset_id FROM product_images WHERE media_asset_id LIKE 'http%' LIMIT 3;
SELECT media_asset_id FROM product_images WHERE media_asset_id NOT LIKE 'http%' LIMIT 3;

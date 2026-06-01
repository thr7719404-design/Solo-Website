-- Search for ERR_NAME_NOT_RESOLVED UUIDs everywhere
SELECT 'media_assets' as tbl, id, key FROM media_assets WHERE id LIKE '%d9699832%' OR key LIKE '%d9699832%' OR id LIKE '%96acd8e0%' OR key LIKE '%96acd8e0%';

-- Check subcategories and categories for these UUIDs
SELECT 'categories' as tbl, id, image_url FROM categories WHERE image_url LIKE '%d9699832%' OR image_url LIKE '%96acd8e0%';
SELECT 'subcategories' as tbl, id, image_url FROM subcategories WHERE image_url LIKE '%d9699832%' OR image_url LIKE '%96acd8e0%';

-- Check what domain the ERR ones come from - search all text in categories
SELECT image_url FROM categories WHERE image_url IS NOT NULL LIMIT 5;
SELECT image_url FROM subcategories WHERE image_url IS NOT NULL LIMIT 5;

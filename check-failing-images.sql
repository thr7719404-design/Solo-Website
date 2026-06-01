-- Find ERR_NAME_NOT_RESOLVED filenames - still on old storage somewhere
SELECT 'product_images' as tbl, media_asset_id FROM product_images WHERE media_asset_id LIKE '%d9699832%' OR media_asset_id LIKE '%96acd8e0%';

-- Find 404 filenames - on new storage but blob missing
SELECT 'product_images' as tbl, media_asset_id FROM product_images WHERE media_asset_id LIKE '%0fefee10%' OR media_asset_id LIKE '%a61d7b1e%' OR media_asset_id LIKE '%3775198b%';

-- Count UUID-only entries (no http) vs full URL entries
SELECT 
  SUM(CASE WHEN media_asset_id LIKE 'http%' THEN 1 ELSE 0 END) as full_url_count,
  SUM(CASE WHEN media_asset_id NOT LIKE 'http%' THEN 1 ELSE 0 END) as uuid_only_count
FROM product_images;

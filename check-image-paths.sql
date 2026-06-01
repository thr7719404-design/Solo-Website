-- Count product_images by path
SELECT 
  CASE 
    WHEN media_asset_id LIKE '%/products/%' THEN 'products/'
    WHEN media_asset_id LIKE '%/general/%' THEN 'general/'
    WHEN media_asset_id LIKE '%/categories/%' THEN 'categories/'
    WHEN media_asset_id LIKE 'http%' THEN 'other_url'
    ELSE 'uuid_only'
  END as path_type,
  COUNT(*) as count
FROM product_images
GROUP BY 1
ORDER BY 2 DESC;

-- Also check how many product images reference files that DO exist (the 21 products/ blobs)
SELECT COUNT(*) as product_images_in_db FROM product_images WHERE media_asset_id LIKE '%/products/%';
SELECT COUNT(*) as product_images_general FROM product_images WHERE media_asset_id LIKE '%/general/%';

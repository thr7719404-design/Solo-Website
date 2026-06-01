UPDATE product_images
SET media_asset_id = REPLACE(media_asset_id, 'stsolowebsite.blob.core.windows.net', 'stmediazuicxoppffzie.blob.core.windows.net')
WHERE media_asset_id LIKE '%stsolowebsite%';

SELECT COUNT(*) AS remaining_old_urls FROM product_images WHERE media_asset_id LIKE '%stsolowebsite%';

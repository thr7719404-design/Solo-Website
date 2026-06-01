-- Backup count
SELECT COUNT(*) as before FROM product_images;
SELECT COUNT(DISTINCT product_id) as products_with_images_before FROM product_images;

-- Delete all product_images (since all 2909 point to missing blobs)
DELETE FROM product_images;

-- Also delete the orphaned media_assets entries (the 240 that were UUID-only references)
-- Keep media_assets that are linked to other things or have valid keys to existing blobs
-- For simplicity, just leave media_assets alone — re-scrape will create new ones

SELECT COUNT(*) as after FROM product_images;

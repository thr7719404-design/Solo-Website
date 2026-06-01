-- Create temp table of existing blob paths
DROP TABLE IF EXISTS existing_blobs;
CREATE TEMP TABLE existing_blobs (path text PRIMARY KEY);

\copy existing_blobs FROM 'd:/Solo Website/existing-blobs.txt'

SELECT COUNT(*) as total_blobs FROM existing_blobs;

-- Count product_images rows pointing to existing vs missing blobs
WITH classified AS (
  SELECT 
    pi.id,
    pi.product_id,
    pi.media_asset_id,
    CASE 
      -- Full URL case: extract path after /media/
      WHEN pi.media_asset_id LIKE 'http%' THEN 
        REGEXP_REPLACE(pi.media_asset_id, '^https?://[^/]+/media/', '')
      -- UUID case: look up media_assets.key
      ELSE (SELECT ma.key FROM media_assets ma WHERE ma.id = pi.media_asset_id)
    END as expected_path
  FROM product_images pi
)
SELECT 
  CASE WHEN eb.path IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status,
  COUNT(*) as count
FROM classified c
LEFT JOIN existing_blobs eb ON eb.path = c.expected_path
GROUP BY 1;

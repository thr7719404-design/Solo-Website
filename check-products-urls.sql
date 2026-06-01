SELECT 'products.image_url' as tbl, COUNT(*) FROM products WHERE image_url LIKE '%stsolowebsite%'
UNION ALL SELECT 'products.image_url total', COUNT(*) FROM products WHERE image_url IS NOT NULL
UNION ALL SELECT 'products.image_url new', COUNT(*) FROM products WHERE image_url LIKE '%stmediazuicxoppffzie%';

SELECT image_url FROM products WHERE image_url IS NOT NULL LIMIT 3;

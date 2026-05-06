-- Update products to mark some as featured, new, and best sellers
-- This is for demo purposes to populate the catalog with realistic data

-- Mark top Eva Solo products as featured (20 products)
UPDATE products 
SET is_featured = TRUE 
WHERE brand_id = (SELECT id FROM brands WHERE brand_name = 'Eva Solo')
AND id IN (
  SELECT id FROM products 
  WHERE brand_id = (SELECT id FROM brands WHERE brand_name = 'Eva Solo')
  ORDER BY id 
  LIMIT 20
);

-- Mark recent products as new (30 products)
UPDATE products 
SET is_new = TRUE 
WHERE id IN (
  SELECT id FROM products 
  ORDER BY created_at DESC 
  LIMIT 30
);

-- Mark popular categories as best sellers (40 products from Tea & Coffee)
UPDATE products 
SET is_best_seller = TRUE 
WHERE category_id = (SELECT id FROM categories WHERE category_name = 'Tea & Coffee')
AND id IN (
  SELECT id FROM products 
  WHERE category_id = (SELECT id FROM categories WHERE category_name = 'Tea & Coffee')
  ORDER BY id 
  LIMIT 40
);

-- Verify counts
SELECT 
  COUNT(*) FILTER (WHERE is_featured = TRUE) as featured_count,
  COUNT(*) FILTER (WHERE is_new = TRUE) as new_count,
  COUNT(*) FILTER (WHERE is_best_seller = TRUE) as best_seller_count,
  COUNT(*) as total_products
FROM products;

UPDATE banners SET "imageDesktopUrl" = REPLACE("imageDesktopUrl", 'stsolowebsite.blob.core.windows.net', 'stmediazuicxoppffzie.blob.core.windows.net') WHERE "imageDesktopUrl" LIKE '%stsolowebsite%';
UPDATE banners SET "imageMobileUrl" = REPLACE("imageMobileUrl", 'stsolowebsite.blob.core.windows.net', 'stmediazuicxoppffzie.blob.core.windows.net') WHERE "imageMobileUrl" LIKE '%stsolowebsite%';
UPDATE brands SET logo_url = REPLACE(logo_url, 'stsolowebsite.blob.core.windows.net', 'stmediazuicxoppffzie.blob.core.windows.net') WHERE logo_url LIKE '%stsolowebsite%';
UPDATE categories SET image_url = REPLACE(image_url, 'stsolowebsite.blob.core.windows.net', 'stmediazuicxoppffzie.blob.core.windows.net') WHERE image_url LIKE '%stsolowebsite%';
UPDATE subcategories SET image_url = REPLACE(image_url, 'stsolowebsite.blob.core.windows.net', 'stmediazuicxoppffzie.blob.core.windows.net') WHERE image_url LIKE '%stsolowebsite%';
UPDATE navigation_menu_items SET "imageUrl" = REPLACE("imageUrl", 'stsolowebsite.blob.core.windows.net', 'stmediazuicxoppffzie.blob.core.windows.net') WHERE "imageUrl" LIKE '%stsolowebsite%';
SELECT 'banners_desktop' as tbl, COUNT(*) FROM banners WHERE "imageDesktopUrl" LIKE '%stsolowebsite%'
UNION ALL SELECT 'banners_mobile', COUNT(*) FROM banners WHERE "imageMobileUrl" LIKE '%stsolowebsite%'
UNION ALL SELECT 'brands', COUNT(*) FROM brands WHERE logo_url LIKE '%stsolowebsite%'
UNION ALL SELECT 'categories', COUNT(*) FROM categories WHERE image_url LIKE '%stsolowebsite%'
UNION ALL SELECT 'subcategories', COUNT(*) FROM subcategories WHERE image_url LIKE '%stsolowebsite%';

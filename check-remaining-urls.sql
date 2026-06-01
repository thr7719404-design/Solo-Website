SELECT 'packages' as tbl, COUNT(*) FROM packages WHERE image LIKE '%stsolowebsite%'
UNION ALL SELECT 'banners_desktop', COUNT(*) FROM banners WHERE "imageDesktopUrl" LIKE '%stsolowebsite%'
UNION ALL SELECT 'banners_mobile', COUNT(*) FROM banners WHERE "imageMobileUrl" LIKE '%stsolowebsite%'
UNION ALL SELECT 'navigation_menu', COUNT(*) FROM navigation_menu_items WHERE "imageUrl" LIKE '%stsolowebsite%'
UNION ALL SELECT 'brands', COUNT(*) FROM brands WHERE logo_url LIKE '%stsolowebsite%'
UNION ALL SELECT 'all_product_images', COUNT(*) FROM product_images WHERE media_asset_id LIKE '%stsolowebsite%';

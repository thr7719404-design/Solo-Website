-- Clean up navigation: remove stale "Blog" main-nav item and seed footer-nav columns.

-- Remove the now-defunct Blog item from main-nav.
DELETE FROM "navigation_menu_items" WHERE "id" = 'main-nav-6';

-- Seed footer-nav columns + child links (idempotent via ON CONFLICT).
DO $$
DECLARE footer_id text;
BEGIN
  SELECT id INTO footer_id FROM "navigation_menus" WHERE "key" = 'footer-nav' LIMIT 1;
  IF footer_id IS NULL THEN
    RETURN;
  END IF;

  -- Column: Shop
  INSERT INTO "navigation_menu_items" ("id", "menuId", "label", "sortOrder", "isActive", "openInNewTab", "createdAt", "updatedAt")
  VALUES ('footer-nav-0', footer_id, 'Shop', 0, true, false, NOW(), NOW())
  ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED."label", "sortOrder" = EXCLUDED."sortOrder";

  INSERT INTO "navigation_menu_items" ("id", "menuId", "parentId", "label", "url", "sortOrder", "isActive", "openInNewTab", "createdAt", "updatedAt") VALUES
    ('footer-nav-0-0', footer_id, 'footer-nav-0', 'New Arrivals', '/new-arrivals', 0, true, false, NOW(), NOW()),
    ('footer-nav-0-1', footer_id, 'footer-nav-0', 'Best Sellers', '/best-sellers', 1, true, false, NOW(), NOW()),
    ('footer-nav-0-2', footer_id, 'footer-nav-0', 'Featured', '/featured', 2, true, false, NOW(), NOW()),
    ('footer-nav-0-3', footer_id, 'footer-nav-0', 'Sale', '/sale', 3, true, false, NOW(), NOW())
  ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED."label", "url" = EXCLUDED."url", "sortOrder" = EXCLUDED."sortOrder";

  -- Column: Account
  INSERT INTO "navigation_menu_items" ("id", "menuId", "label", "sortOrder", "isActive", "openInNewTab", "createdAt", "updatedAt")
  VALUES ('footer-nav-1', footer_id, 'Account', 1, true, false, NOW(), NOW())
  ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED."label", "sortOrder" = EXCLUDED."sortOrder";

  INSERT INTO "navigation_menu_items" ("id", "menuId", "parentId", "label", "url", "sortOrder", "isActive", "openInNewTab", "createdAt", "updatedAt") VALUES
    ('footer-nav-1-0', footer_id, 'footer-nav-1', 'My Account', '/account', 0, true, false, NOW(), NOW()),
    ('footer-nav-1-1', footer_id, 'footer-nav-1', 'Order History', '/account/orders', 1, true, false, NOW(), NOW()),
    ('footer-nav-1-2', footer_id, 'footer-nav-1', 'Wishlist', '/favorites', 2, true, false, NOW(), NOW()),
    ('footer-nav-1-3', footer_id, 'footer-nav-1', 'Cart', '/cart', 3, true, false, NOW(), NOW())
  ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED."label", "url" = EXCLUDED."url", "sortOrder" = EXCLUDED."sortOrder";

  -- Column: Help
  INSERT INTO "navigation_menu_items" ("id", "menuId", "label", "sortOrder", "isActive", "openInNewTab", "createdAt", "updatedAt")
  VALUES ('footer-nav-2', footer_id, 'Help', 2, true, false, NOW(), NOW())
  ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED."label", "sortOrder" = EXCLUDED."sortOrder";

  INSERT INTO "navigation_menu_items" ("id", "menuId", "parentId", "label", "url", "sortOrder", "isActive", "openInNewTab", "createdAt", "updatedAt") VALUES
    ('footer-nav-2-0', footer_id, 'footer-nav-2', 'Shipping', '/pages/shipping', 0, true, false, NOW(), NOW()),
    ('footer-nav-2-1', footer_id, 'footer-nav-2', 'Returns', '/pages/returns', 1, true, false, NOW(), NOW()),
    ('footer-nav-2-2', footer_id, 'footer-nav-2', 'Contact Us', '/pages/contact', 2, true, false, NOW(), NOW()),
    ('footer-nav-2-3', footer_id, 'footer-nav-2', 'FAQ', '/pages/faq', 3, true, false, NOW(), NOW()),
    ('footer-nav-2-4', footer_id, 'footer-nav-2', 'Bulk Orders', '/bulk-order', 4, true, false, NOW(), NOW())
  ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED."label", "url" = EXCLUDED."url", "sortOrder" = EXCLUDED."sortOrder";
END $$;

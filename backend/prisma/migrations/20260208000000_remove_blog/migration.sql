-- Remove blog feature: drop tables in FK-safe order.
-- BLOG_LATEST_GRID enum value on "LandingSectionType" is intentionally left in place
-- (no rows reference it; PostgreSQL cannot drop enum values without recreating the type).

DROP TABLE IF EXISTS "blog_post_tags";
DROP TABLE IF EXISTS "blog_posts";
DROP TABLE IF EXISTS "blog_tags";
DROP TABLE IF EXISTS "blog_categories";

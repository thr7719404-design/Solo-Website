-- ============================================================================
-- Cleanup script: Remove all customer / transactional data for fresh launch
-- ----------------------------------------------------------------------------
-- KEEPS:  products, product_groups, categories, subcategories, brands,
--         designers, countries, media_assets, home page / landing / banner
--         config, navigation menus, site_settings, promo_codes, admin users
-- DELETES: customers, addresses, carts, favorites, orders, invoices, returns,
--          payment methods, loyalty data, auth tokens, audit logs, bulk
--          orders, stock movements, stripe events
--
-- Run BEFORE this: full pg_dump backup (already done -> backups/pre-cleanup/)
-- Wrapped in a single transaction. Rollback on any error.
-- ============================================================================

BEGIN;

-- 1. Pre-cleanup row counts (visible in psql output)
\echo '=== PRE-CLEANUP ROW COUNTS ==='
SELECT 'users (all)'             AS table_, COUNT(*) FROM users
UNION ALL SELECT 'users (CUSTOMER)',         COUNT(*) FROM users WHERE role = 'CUSTOMER'
UNION ALL SELECT 'orders',                   COUNT(*) FROM orders
UNION ALL SELECT 'invoices',                 COUNT(*) FROM invoices
UNION ALL SELECT 'carts',                    COUNT(*) FROM carts
UNION ALL SELECT 'addresses',                COUNT(*) FROM addresses
UNION ALL SELECT 'audit_logs',               COUNT(*) FROM audit_logs
UNION ALL SELECT 'stock_movements',          COUNT(*) FROM stock_movements
UNION ALL SELECT 'products (KEEP)',          COUNT(*) FROM products
UNION ALL SELECT 'categories (KEEP)',        COUNT(*) FROM categories
UNION ALL SELECT 'brands (KEEP)',            COUNT(*) FROM brands;

-- 2. Truncate transactional/customer tables
--    Order matters because of FKs; CASCADE handles dependent rows in one shot.
TRUNCATE TABLE
    -- Order chain
    order_status_history,
    order_items,
    invoices,
    returns,
    return_items,
    orders,
    -- Cart
    cart_items,
    carts,
    -- Customer-owned
    favorites,
    addresses,
    saved_payment_methods,
    loyalty_transactions,
    loyalty_wallets,
    -- Auth artefacts
    refresh_tokens,
    password_reset_tokens,
    email_verification_tokens,
    -- Bulk orders / quotes
    bulk_order_items,
    bulk_order_requests,
    -- Operational logs
    audit_logs,
    stock_movements,
    stripe_events
RESTART IDENTITY CASCADE;

-- 3. Delete only CUSTOMER users (keep SUPER_ADMIN, ADMIN, etc.)
DELETE FROM users WHERE role = 'CUSTOMER';

-- 4. Post-cleanup verification
\echo ''
\echo '=== POST-CLEANUP ROW COUNTS ==='
SELECT 'users (all)'             AS table_, COUNT(*) FROM users
UNION ALL SELECT 'users (CUSTOMER)',         COUNT(*) FROM users WHERE role = 'CUSTOMER'
UNION ALL SELECT 'orders',                   COUNT(*) FROM orders
UNION ALL SELECT 'invoices',                 COUNT(*) FROM invoices
UNION ALL SELECT 'carts',                    COUNT(*) FROM carts
UNION ALL SELECT 'addresses',                COUNT(*) FROM addresses
UNION ALL SELECT 'audit_logs',               COUNT(*) FROM audit_logs
UNION ALL SELECT 'stock_movements',          COUNT(*) FROM stock_movements
UNION ALL SELECT 'products (KEEP)',          COUNT(*) FROM products
UNION ALL SELECT 'categories (KEEP)',        COUNT(*) FROM categories
UNION ALL SELECT 'brands (KEEP)',            COUNT(*) FROM brands;

\echo ''
\echo '=== REMAINING ADMIN USERS ==='
SELECT email, role FROM users ORDER BY role, email;

-- 5. Commit (change to ROLLBACK if you want a dry run)
COMMIT;

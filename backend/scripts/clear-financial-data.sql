-- =====================================================================
-- Targeted reset: clears ORDERS, RETURNS, FINANCIAL & TRANSACTIONAL data.
-- Preserves: Users, Products, Categories, Brands, Designers, CMS, Settings,
--            Loyalty wallets, Saved addresses, Favourites.
--
-- USAGE (manual, never automated):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f clear-financial-data.sql
--
-- This script is ONE TRANSACTION. If anything fails, NOTHING is deleted.
-- =====================================================================

BEGIN;

-- 1. Returns (children first)
DELETE FROM return_items;
DELETE FROM returns;

-- 2. Stock movements tied to orders
DELETE FROM stock_movements;

-- 3. Order graph
DELETE FROM order_status_history;
DELETE FROM order_items;
DELETE FROM orders;

-- 4. Standalone invoices table (legacy)
DELETE FROM invoices;

-- 5. Bulk-order requests
DELETE FROM bulk_order_items;
DELETE FROM bulk_order_requests;

-- 6. Payment / financial events
DELETE FROM stripe_events;

-- 7. Loyalty TRANSACTIONS only (keeps wallets so balances reset to 0 cleanly)
DELETE FROM loyalty_transactions;
UPDATE loyalty_wallets SET "balanceAed" = 0, "totalEarnedAed" = 0, "totalRedeemedAed" = 0;

-- 8. Active carts (so no orphan checkouts pointing at gone data)
DELETE FROM cart_items;
DELETE FROM carts;

-- Sanity check
SELECT 'orders'              AS tbl, COUNT(*) AS remaining FROM orders
UNION ALL SELECT 'order_items',          COUNT(*) FROM order_items
UNION ALL SELECT 'returns',              COUNT(*) FROM returns
UNION ALL SELECT 'invoices',             COUNT(*) FROM invoices
UNION ALL SELECT 'loyalty_transactions', COUNT(*) FROM loyalty_transactions
UNION ALL SELECT 'stripe_events',        COUNT(*) FROM stripe_events
UNION ALL SELECT 'bulk_order_requests',  COUNT(*) FROM bulk_order_requests
UNION ALL SELECT 'stock_movements',      COUNT(*) FROM stock_movements
UNION ALL SELECT 'carts',                COUNT(*) FROM carts
-- Things we KEEP — should stay > 0
UNION ALL SELECT 'users (KEPT)',         COUNT(*) FROM users
UNION ALL SELECT 'products (KEPT)',      COUNT(*) FROM products
UNION ALL SELECT 'categories (KEPT)',    COUNT(*) FROM categories;

COMMIT;

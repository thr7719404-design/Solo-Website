SELECT 'orders' AS tbl, COUNT(*) AS c FROM orders
UNION ALL SELECT 'order_items',COUNT(*) FROM order_items
UNION ALL SELECT 'order_status_history',COUNT(*) FROM order_status_history
UNION ALL SELECT 'returns',COUNT(*) FROM returns
UNION ALL SELECT 'return_items',COUNT(*) FROM return_items
UNION ALL SELECT 'invoices',COUNT(*) FROM invoices
UNION ALL SELECT 'loyalty_transactions',COUNT(*) FROM loyalty_transactions
UNION ALL SELECT 'stripe_events',COUNT(*) FROM stripe_events
UNION ALL SELECT 'bulk_order_requests',COUNT(*) FROM bulk_order_requests
UNION ALL SELECT 'bulk_order_items',COUNT(*) FROM bulk_order_items
UNION ALL SELECT 'stock_movements',COUNT(*) FROM stock_movements
UNION ALL SELECT 'carts',COUNT(*) FROM carts
UNION ALL SELECT 'cart_items',COUNT(*) FROM cart_items
UNION ALL SELECT 'loyalty_wallets',COUNT(*) FROM loyalty_wallets
UNION ALL SELECT 'users',COUNT(*) FROM users
UNION ALL SELECT 'products',COUNT(*) FROM products
UNION ALL SELECT 'categories',COUNT(*) FROM categories;

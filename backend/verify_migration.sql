SELECT 
    column_name, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'bulk_order_requests' AND column_name = 'order_number';

SELECT 
    indexname 
FROM pg_indexes 
WHERE tablename = 'bulk_order_requests' AND indexname = 'bulk_order_requests_order_number_key';

SELECT MAX(order_number) FROM bulk_order_requests;

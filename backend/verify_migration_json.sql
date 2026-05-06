SELECT json_build_object(
  'schema', (SELECT json_agg(t) FROM (SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'bulk_order_requests' AND column_name = 'order_number') t),
  'index', (SELECT json_agg(t) FROM (SELECT indexname FROM pg_indexes WHERE tablename = 'bulk_order_requests' AND indexname = 'bulk_order_requests_order_number_key') t),
  'max_order', (SELECT max(order_number) FROM bulk_order_requests)
);

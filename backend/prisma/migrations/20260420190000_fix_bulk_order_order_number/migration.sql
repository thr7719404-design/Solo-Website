DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'bulk_order_requests'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulk_order_requests'
      AND column_name = 'order_number'
  ) THEN
    ALTER TABLE "bulk_order_requests"
      ADD COLUMN "order_number" INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulk_order_requests'
      AND column_name = 'order_number'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'S'
      AND relname = 'bulk_order_requests_order_number_seq'
  ) THEN
    CREATE SEQUENCE "bulk_order_requests_order_number_seq";
  END IF;
END $$;

DO $$
DECLARE
  next_order_number INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulk_order_requests'
      AND column_name = 'order_number'
  ) THEN
    WITH ranked_orders AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS generated_order_number
      FROM "bulk_order_requests"
      WHERE "order_number" IS NULL
    )
    UPDATE "bulk_order_requests" AS requests
    SET "order_number" = ranked_orders.generated_order_number
    FROM ranked_orders
    WHERE requests.id = ranked_orders.id;

    SELECT COALESCE(MAX("order_number"), 0) + 1
    INTO next_order_number
    FROM "bulk_order_requests";

    PERFORM setval(
      'bulk_order_requests_order_number_seq',
      next_order_number,
      false
    );

    ALTER TABLE "bulk_order_requests"
      ALTER COLUMN "order_number" SET DEFAULT nextval('bulk_order_requests_order_number_seq');

    ALTER SEQUENCE "bulk_order_requests_order_number_seq"
      OWNED BY "bulk_order_requests"."order_number";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulk_order_requests'
      AND column_name = 'order_number'
  ) THEN
    ALTER TABLE "bulk_order_requests"
      ALTER COLUMN "order_number" SET NOT NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "bulk_order_requests_order_number_key"
  ON "bulk_order_requests"("order_number");
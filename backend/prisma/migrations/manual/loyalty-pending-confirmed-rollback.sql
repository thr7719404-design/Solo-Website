-- Rollback for loyalty-pending-confirmed.sql
-- ONLY run if you need to fully revert. Drops new column + status column + enum.
-- WARNING: Will lose pendingBalanceAed values and per-txn status info.

DROP INDEX IF EXISTS idx_loyalty_txn_order_status;
ALTER TABLE loyalty_transactions DROP COLUMN IF EXISTS status;
ALTER TABLE loyalty_wallets DROP COLUMN IF EXISTS "pendingBalanceAed";
DROP TYPE IF EXISTS "LoyaltyTransactionStatus";

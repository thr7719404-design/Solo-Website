-- Loyalty lifecycle migration (additive, backwards-compatible).
-- Applied: 2026-05-17
-- Rollback: see loyalty-pending-confirmed-rollback.sql

-- 1. Add pendingBalanceAed column to loyalty_wallets (default 0)
ALTER TABLE loyalty_wallets
  ADD COLUMN IF NOT EXISTS "pendingBalanceAed" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- 2. Create LoyaltyTransactionStatus enum (idempotent)
DO $$
BEGIN
  CREATE TYPE "LoyaltyTransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REVERSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- 3. Add status column to loyalty_transactions (default CONFIRMED so existing rows preserve semantics)
ALTER TABLE loyalty_transactions
  ADD COLUMN IF NOT EXISTS status "LoyaltyTransactionStatus" NOT NULL DEFAULT 'CONFIRMED';

-- 4. Index for fast lookup of pending earn txns per order
CREATE INDEX IF NOT EXISTS idx_loyalty_txn_order_status
  ON loyalty_transactions ("orderId", status, type);

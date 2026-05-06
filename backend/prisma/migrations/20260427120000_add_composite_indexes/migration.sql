-- Composite indexes to speed up "user's orders / wallet transactions ordered by date"
-- queries on /account/orders and loyalty wallet pages. Replaces filter+sort with a
-- single index scan in Postgres.

CREATE INDEX IF NOT EXISTS "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "loyalty_transactions_walletId_createdAt_idx" ON "loyalty_transactions"("walletId", "createdAt");

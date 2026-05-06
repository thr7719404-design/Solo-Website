-- Add TABBY and TAMARA to the PaymentMethod enum in PostgreSQL
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'TABBY';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'TAMARA';

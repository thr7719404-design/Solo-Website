const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const cmds = [
    'ALTER TABLE carts ADD COLUMN IF NOT EXISTS "promoCode" VARCHAR(50)',
    'ALTER TABLE carts ADD COLUMN IF NOT EXISTS "promoCodeId" TEXT',
    'ALTER TABLE carts ADD COLUMN IF NOT EXISTS "promoDiscount" DECIMAL(10,2)',
    'ALTER TABLE carts ADD COLUMN IF NOT EXISTS "guestKey" UUID',
    'ALTER TABLE carts ADD COLUMN IF NOT EXISTS "createdFrom" VARCHAR(30)',
    'ALTER TABLE carts ALTER COLUMN "userId" DROP NOT NULL',
    // Also fix cart_items.productId to be Int if needed
    'ALTER TABLE cart_items ALTER COLUMN "productId" TYPE INTEGER USING "productId"::integer',
  ];
  for (const sql of cmds) {
    try {
      await p.$executeRawUnsafe(sql);
      console.log('OK:', sql.substring(0, 60));
    } catch (e) {
      console.log('SKIP:', sql.substring(0, 60), '-', e.message?.substring(0, 80));
    }
  }
}

main().catch(console.error).finally(() => p.$disconnect());

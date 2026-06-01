/**
 * One-off cleanup: clamp negative reservedQty to 0 across products.
 * Negative values can result from historical inconsistencies where stock was
 * confirmed/restored more times than it was reserved.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const negatives = await prisma.product.findMany({
    where: { reservedQty: { lt: 0 } },
    select: { id: true, sku: true, productName: true, stockQty: true, reservedQty: true },
  });
  console.log(`[clamp] products with negative reservedQty: ${negatives.length}`);
  for (const p of negatives) {
    console.log(`  - ${p.sku ?? p.id} (${p.productName}): stock=${p.stockQty} reserved=${p.reservedQty}`);
  }
  if (negatives.length === 0) return;

  const result = await prisma.product.updateMany({
    where: { reservedQty: { lt: 0 } },
    data: { reservedQty: 0 },
  });
  console.log(`[clamp] reset ${result.count} products to reservedQty=0`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

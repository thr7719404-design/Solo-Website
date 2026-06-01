/**
 * Backfill script for stock reservations that were never confirmed.
 *
 * Context: Before the SHIPPED/DELIVERED fix, the order lifecycle only confirmed
 * stock on PAYMENT_PENDING -> PROCESSING. COD orders (which start at PROCESSING)
 * and admin-driven SHIPPED/DELIVERED transitions never decremented stockQty,
 * leaving reservedQty inflated forever. This script walks through every order
 * that should already have had its stock confirmed (PROCESSING/PAID/SHIPPED/
 * DELIVERED with no ORDER_CONFIRM movement) and runs the confirmation now.
 *
 * Safe to re-run: ORDER_CONFIRM existence is checked per order, and confirmed
 * orders are skipped. CANCELLED/REFUNDED orders are not touched here (those
 * have their own correct paths).
 *
 * Usage (inside the backend container or from a workspace with DB access):
 *   npx ts-node scripts/backfill-stock-confirmations.ts
 *   npx ts-node scripts/backfill-stock-confirmations.ts --dry-run
 */
import { PrismaClient, OrderStatus, StockMovementType } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`[backfill] starting (dryRun=${DRY_RUN})`);

  // Statuses where stock should already have been removed from inventory
  const fulfilledStatuses: OrderStatus[] = [
    OrderStatus.PROCESSING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  const orders = await prisma.order.findMany({
    where: { status: { in: fulfilledStatuses } },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`[backfill] candidate orders: ${orders.length}`);

  let confirmed = 0;
  let skippedAlready = 0;
  let skippedNoItems = 0;
  let failed = 0;
  // perProduct: track running net delta so we can summarise impact.
  const perProductDelta = new Map<number, number>();

  for (const order of orders) {
    const stockItems = order.items
      .filter((i): i is typeof i & { productId: number } => i.productId != null)
      .map((i) => ({ productId: i.productId, quantity: i.quantity }));

    if (stockItems.length === 0) {
      skippedNoItems++;
      continue;
    }

    const existingConfirm = await prisma.stockMovement.findFirst({
      where: { reference: order.id, type: StockMovementType.ORDER_CONFIRM },
      select: { id: true },
    });
    if (existingConfirm) {
      skippedAlready++;
      continue;
    }

    // We also need to verify a reservation actually exists — otherwise nothing was
    // reserved and confirming would over-decrement.
    const existingReserve = await prisma.stockMovement.findFirst({
      where: { reference: order.id, type: StockMovementType.ORDER_RESERVE },
      select: { id: true },
    });
    if (!existingReserve) {
      console.warn(`[backfill] order ${order.orderNumber} has no ORDER_RESERVE movement; skipping to avoid over-decrement`);
      continue;
    }

    try {
      if (DRY_RUN) {
        for (const item of stockItems) {
          perProductDelta.set(item.productId, (perProductDelta.get(item.productId) ?? 0) - item.quantity);
        }
        console.log(`[backfill] [dry] would confirm order ${order.orderNumber} (${order.status}) items=${stockItems.length}`);
      } else {
        await prisma.$transaction(async (tx) => {
          for (const item of stockItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQty: { decrement: item.quantity },
                reservedQty: { decrement: item.quantity },
              },
            });
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                type: StockMovementType.ORDER_CONFIRM,
                reference: order.id,
                notes: `Backfilled confirmation for order ${order.orderNumber} (${order.status})`,
                createdBy: 'backfill-script',
              },
            });
            perProductDelta.set(item.productId, (perProductDelta.get(item.productId) ?? 0) - item.quantity);
          }
        });
        console.log(`[backfill] confirmed order ${order.orderNumber} (${order.status})`);
      }
      confirmed++;
    } catch (err) {
      failed++;
      console.error(`[backfill] FAILED order ${order.orderNumber}: ${(err as Error).message}`);
    }
  }

  console.log('');
  console.log('[backfill] summary');
  console.log(`  candidates:           ${orders.length}`);
  console.log(`  confirmed (${DRY_RUN ? 'dry' : 'live'}):     ${confirmed}`);
  console.log(`  skipped (already):    ${skippedAlready}`);
  console.log(`  skipped (no items):   ${skippedNoItems}`);
  console.log(`  failed:               ${failed}`);
  console.log(`  unique products touched: ${perProductDelta.size}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

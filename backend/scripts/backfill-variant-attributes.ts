/* eslint-disable no-console */
/**
 * Backfill products.variant_attributes JSON based on productGroup.variantAxes,
 * sourcing values from Product.colour and Product.size columns and normalizing
 * known wrong-case keys (colorname -> colorName, colorhex -> colorHex).
 *
 * Run:
 *   $env:DATABASE_URL="postgresql://soloadmin:...@pg-zuicxoppffzie.postgres.database.azure.com:5432/solo_ecommerce?schema=public&sslmode=require"
 *   npx ts-node scripts/backfill-variant-attributes.ts            # dry run
 *   npx ts-node scripts/backfill-variant-attributes.ts --apply    # write
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

interface Attrs { [k: string]: unknown }

function normalize(raw: any): Attrs {
  const a: Attrs = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  if ('colorname' in a && !('colorName' in a)) { a.colorName = a.colorname; delete a.colorname; }
  if ('colorhex' in a && !('colorHex' in a)) { a.colorHex = a.colorhex; delete a.colorhex; }
  if ('color_name' in a && !('colorName' in a)) { a.colorName = a.color_name; delete a.color_name; }
  if ('color_hex' in a && !('colorHex' in a)) { a.colorHex = a.color_hex; delete a.color_hex; }
  return a;
}

function shallowEqual(a: Attrs, b: Attrs): boolean {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    if (ak[i] !== bk[i]) return false;
    if (JSON.stringify(a[ak[i]]) !== JSON.stringify(b[ak[i]])) return false;
  }
  return true;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { productGroupId: { not: null } },
    include: { productGroup: true },
  });

  console.log(`Found ${products.length} products linked to groups. APPLY=${APPLY}`);

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const p of products) {
    const axes: string[] = Array.isArray(p.productGroup?.variantAxes)
      ? (p.productGroup!.variantAxes as unknown as string[])
      : ['color'];

    const next = normalize(p.variantAttributes as any);

    if (axes.includes('color')) {
      if (!next.colorName && (p as any).colour) next.colorName = (p as any).colour;
    }
    if (axes.includes('size')) {
      if (!next.size && (p as any).size) next.size = (p as any).size;
    }

    const prev = (p.variantAttributes && typeof p.variantAttributes === 'object') ? p.variantAttributes as Attrs : {};
    if (shallowEqual(prev, next)) { unchanged++; continue; }

    const missingColor = axes.includes('color') && !next.colorName;
    const missingSize = axes.includes('size') && !next.size;
    const tag = (missingColor || missingSize) ? ' [INCOMPLETE]' : '';

    console.log(`#${p.id} "${(p as any).productName ?? (p as any).name}" group=${p.productGroup?.name} axes=${JSON.stringify(axes)}${tag}`);
    console.log(`  prev: ${JSON.stringify(prev)}`);
    console.log(`  next: ${JSON.stringify(next)}`);

    if (APPLY) {
      await prisma.product.update({ where: { id: p.id }, data: { variantAttributes: next as any } });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nSummary: changed=${APPLY ? updated : skipped} unchanged=${unchanged} total=${products.length} mode=${APPLY ? 'APPLIED' : 'DRY-RUN'}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

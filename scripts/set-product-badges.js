// Script to mark some products as Featured, Best Seller, and New Arrival
const { PrismaClient } = require('../backend/node_modules/@prisma/client');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL env var is required.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

async function main() {
  console.log('Fetching active products...');
  
  // Get all active products with stock
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stockQty: { gt: 0 }
    },
    orderBy: { createdAt: 'desc' },
    take: 18
  });
  
  console.log(`Found ${products.length} active products`);
  
  // Mark first 6 as featured
  const featuredIds = products.slice(0, 6).map(p => p.id);
  const featuredResult = await prisma.product.updateMany({
    where: { id: { in: featuredIds } },
    data: { isFeatured: true }
  });
  console.log(`Marked ${featuredResult.count} products as Featured`);
  
  // Mark next 6 as best sellers (or overlap for variety)
  const bestSellerIds = products.slice(3, 9).map(p => p.id);
  const bestSellerResult = await prisma.product.updateMany({
    where: { id: { in: bestSellerIds } },
    data: { isBestSeller: true }
  });
  console.log(`Marked ${bestSellerResult.count} products as Best Seller`);
  
  // Mark last 6 as new arrivals
  const newArrivalIds = products.slice(0, 6).map(p => p.id);
  const newArrivalResult = await prisma.product.updateMany({
    where: { id: { in: newArrivalIds } },
    data: { isNew: true }
  });
  console.log(`Marked ${newArrivalResult.count} products as New Arrival`);
  
  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

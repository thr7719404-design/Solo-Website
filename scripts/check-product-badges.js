// Check product badges in database
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

async function check() {
  // Only show products with badges enabled
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [{ isFeatured: true }, { isBestSeller: true }, { isNew: true }]
    },
    select: { id: true, productName: true, isFeatured: true, isBestSeller: true, isNew: true },
    orderBy: { id: 'asc' }
  });
  
  console.log('\n=== Products with Badges Enabled in Production Database ===\n');
  
  products.forEach(p => {
    const badges = [];
    if (p.isFeatured) badges.push('FEATURED');
    if (p.isBestSeller) badges.push('BEST SELLER');
    if (p.isNew) badges.push('NEW ARRIVAL');
    console.log(`ID ${p.id}: ${p.productName}`);
    console.log(`   Badges: [${badges.join(', ')}]`);
  });
  
  const featuredCount = products.filter(p => p.isFeatured).length;
  const bestSellerCount = products.filter(p => p.isBestSeller).length;
  const newArrivalCount = products.filter(p => p.isNew).length;
  
  console.log('\n=== Summary ===');
  console.log(`Total products with any badge: ${products.length}`);
  console.log(`Featured products: ${featuredCount}`);
  console.log(`Best Seller products: ${bestSellerCount}`);
  console.log(`New Arrival products: ${newArrivalCount}`);
  
  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});

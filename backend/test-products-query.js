const { PrismaClient } = require('@prisma/inventory-client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/inventory_db?schema=public'
    }
  },
  log: ['query', 'error', 'warn'],
});

async function main() {
  try {
    // Try a complex query like the products service does
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        brand: true,
        category: true,
        subcategory: true,
        pricing: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    
    console.log('Products found:', products.length);
    if (products.length > 0) {
      console.log('First product keys:', Object.keys(products[0]));
      console.log('Brand:', products[0].brand);
      console.log('Category:', products[0].category);
      console.log('Pricing:', products[0].pricing);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
  }
}

main().finally(() => prisma.$disconnect());

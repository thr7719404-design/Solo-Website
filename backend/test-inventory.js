const { PrismaClient } = require('@prisma/inventory-client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/inventory_db?schema=public'
    }
  }
});

async function main() {
  try {
    // Check product_images columns
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_images'
      ORDER BY ordinal_position
    `;
    console.log('Columns in product_images:');
    console.log(columns);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().finally(() => prisma.$disconnect());

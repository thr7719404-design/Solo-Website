const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const products = await prisma.invProduct.findMany({ take: 5, orderBy: { id: 'asc' } });

    console.log('Updating these product IDs:', products.map(p => p.id));

    await prisma.invProduct.updateMany({
      where: { id: { in: products.map(p => p.id) } },
      data: { categoryId: 19 }
    });

    const check = await prisma.invProduct.findMany({
      where: { id: { in: products.map(p => p.id) } },
      select: { id: true, productName: true, categoryId: true, subcategoryId: true }
    });

    console.log('Updated products:');
    console.log(check);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

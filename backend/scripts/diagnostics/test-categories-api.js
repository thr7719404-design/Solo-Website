const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      take: 2,
      include: { children: true },
    });
    console.log('✅ SUCCESS! Found', categories.length, 'parent categories');
    console.log(JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updates = [
    { id: 1, subcategoryId: 33 },
    { id: 2, subcategoryId: 34 },
    { id: 3, subcategoryId: 34 },
    { id: 4, subcategoryId: 34 },
    { id: 5, subcategoryId: 39 },
  ];

  for (const u of updates) {
    await prisma.invProduct.update({
      where: { id: u.id },
      data: { subcategoryId: u.subcategoryId },
    });
  }

  const check = await prisma.invProduct.findMany({
    where: { id: { in: updates.map(x => x.id) } },
    select: { id: true, productName: true, categoryId: true, subcategoryId: true },
    orderBy: { id: 'asc' },
  });

  console.table(check);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());

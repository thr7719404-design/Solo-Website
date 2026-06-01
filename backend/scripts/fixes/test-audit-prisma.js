const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 3 });
    console.log('findMany OK, rows=' + rows.length);
    const count = await prisma.auditLog.count();
    console.log('count=' + count);
    // mimic controller path
    const out = await prisma.auditLog.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 50,
    });
    console.log('paginated OK, rows=' + out.length);
  } catch (e) {
    console.log('PRISMA ERROR:', e.message);
    console.log('code:', e.code);
  } finally {
    await prisma.$disconnect();
  }
})();

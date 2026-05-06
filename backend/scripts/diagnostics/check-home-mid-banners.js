const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBanners() {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        placement: 'HOME_MID',
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        startAt: true,
        endAt: true,
        placement: true,
      },
    });
    
    console.log('HOME_MID Banners:');
    console.log(JSON.stringify(banners, null, 2));
    console.log('\nTotal:', banners.length);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkBanners();

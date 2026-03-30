const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBannerImages() {
  try {
    const banner = await prisma.banner.findFirst({
      where: {
        placement: 'HOME_MID',
        isActive: true,
      },
    });

    if (!banner) {
      console.log('NO_ACTIVE_HOME_MID_BANNER');
      return;
    }

    const updated = await prisma.banner.update({
      where: { id: banner.id },
      data: {
        imageDesktopUrl: 'https://picsum.photos/1200/400',
        imageMobileUrl: 'https://picsum.photos/800/600',
      },
    });

    console.log('UPDATED', updated.id);
    console.log('Desktop URL:', updated.imageDesktopUrl);
    console.log('Mobile URL:', updated.imageMobileUrl);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateBannerImages();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createHomePage() {
  try {
    console.log('🔍 Checking for home landing page...');
    
    // Check if home page exists
    let homePage = await prisma.landingPage.findUnique({
      where: { slug: 'home' },
      include: { sections: true }
    });
    
    // Create home page if it doesn't exist
    if (!homePage) {
      console.log('📄 Creating home landing page...');
      homePage = await prisma.landingPage.create({
        data: {
          title: 'Home Page',
          slug: 'home',
          description: 'Main homepage with dynamic sections',
          isPublished: true,
          metaTitle: 'Welcome to Solo Ecommerce',
          metaDescription: 'Your one-stop shop for quality kitchen products',
        }
      });
      console.log('✅ Home page created!');
    } else {
      console.log('✓ Home page already exists');
    }
    
    // Check if CATEGORY_TILES section exists
    const existingSection = homePage.sections?.find(s => s.type === 'CATEGORY_TILES');
    
    if (existingSection) {
      console.log('✓ CATEGORY_TILES section already exists');
    } else {
      console.log('🎨 Creating CATEGORY_TILES section...');
      
      // Get max display order
      const maxOrder = await prisma.landingSection.findFirst({
        where: { landingPageId: homePage.id },
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true }
      });
      
      const displayOrder = (maxOrder?.displayOrder || 0) + 1;
      
      // Create CATEGORY_TILES section
      await prisma.landingSection.create({
        data: {
          landingPageId: homePage.id,
          type: 'CATEGORY_TILES',
          title: 'Shop by Collection',
          displayOrder,
          isActive: true,
          data: JSON.stringify({
            tiles: [
              {
                title: 'Cookware',
                imageUrl: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600',
                linkUrl: '/category/cookware'
              },
              {
                title: 'Bakeware',
                imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
                linkUrl: '/category/bakeware'
              },
              {
                title: 'Kitchen Tools',
                imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600',
                linkUrl: '/category/kitchen-tools'
              },
              {
                title: 'Small Appliances',
                imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600',
                linkUrl: '/category/small-appliances'
              }
            ]
          }),
          config: JSON.stringify({
            columns: 4,
            mobileColumns: 2,
            aspectRatio: 1.2,
            showTitle: true,
            overlayOpacity: 0.3
          })
        }
      });
      
      console.log('✅ CATEGORY_TILES section created!');
    }
    
    // Verify
    const result = await prisma.landingPage.findUnique({
      where: { slug: 'home' },
      include: { 
        sections: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
    
    console.log('\n📊 Home page summary:');
    console.log(`   Page ID: ${result.id}`);
    console.log(`   Title: ${result.title}`);
    console.log(`   Published: ${result.isPublished}`);
    console.log(`   Sections: ${result.sections.length}`);
    result.sections.forEach(section => {
      console.log(`     - ${section.type} (${section.title}) - Active: ${section.isActive}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createHomePage();

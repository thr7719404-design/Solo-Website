// Seed script for inventory schema
// Run with: npx ts-node prisma/seed-inventory.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  console.log('🌱 Seeding inventory database...\n');

  // ============================================================================
  // 1. Create Countries
  // ============================================================================
  console.log('Creating countries...');
  
  const countries = [
    { countryCode: 'USA', countryName: 'United States' },
    { countryCode: 'CHN', countryName: 'China' },
    { countryCode: 'JPN', countryName: 'Japan' },
    { countryCode: 'DEU', countryName: 'Germany' },
    { countryCode: 'ITA', countryName: 'Italy' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { countryCode: country.countryCode },
      update: {},
      create: country,
    });
  }
  console.log(`✅ ${countries.length} countries created`);

  // ============================================================================
  // 2. Create Brands
  // ============================================================================
  console.log('\nCreating brands...');

  const brands = [
    { name: 'Solo Home', slug: 'solo-home', description: 'Our premium house brand for quality home essentials', isActive: true },
    { name: 'Elite Kitchen', slug: 'elite-kitchen', description: 'Professional-grade kitchenware for home chefs', isActive: true },
    { name: 'Outdoor Pro', slug: 'outdoor-pro', description: 'Adventure-ready outdoor and camping gear', isActive: true },
    { name: 'Modern Living', slug: 'modern-living', description: 'Contemporary furniture and home decor', isActive: true },
    { name: 'Travel Essentials', slug: 'travel-essentials', description: 'Smart solutions for travelers', isActive: true },
    { name: 'Artisan Crafts', slug: 'artisan-crafts', description: 'Handcrafted artisanal products', isActive: true },
  ];

  const createdBrands: { id: number; name: string }[] = [];
  for (const brand of brands) {
    const created = await prisma.brand.upsert({
      where: { name: brand.name },
      update: {},
      create: brand,
    });
    createdBrands.push(created);
  }
  console.log(`✅ ${brands.length} brands created`);

  // ============================================================================
  // 3. Create Designers
  // ============================================================================
  console.log('\nCreating designers...');

  const designers = [
    { name: 'Sarah Chen', slug: 'sarah-chen', bio: 'Award-winning industrial designer', isActive: true },
    { name: 'Marco Rossi', slug: 'marco-rossi', bio: 'Italian design maestro', isActive: true },
    { name: 'Yuki Tanaka', slug: 'yuki-tanaka', bio: 'Minimalist design specialist', isActive: true },
    { name: 'In-House Design', slug: 'in-house-design', bio: 'Solo Home design team', isActive: true },
  ];

  const createdDesigners: { id: number; name: string }[] = [];
  for (const designer of designers) {
    const created = await prisma.designer.upsert({
      where: { name: designer.name },
      update: {},
      create: designer,
    });
    createdDesigners.push(created);
  }
  console.log(`✅ ${designers.length} designers created`);

  // ============================================================================
  // 4. Create Categories
  // ============================================================================
  console.log('\nCreating categories...');

  const categories = [
    { name: 'Kitchenware', slug: 'kitchenware', description: 'Essential tools and equipment for your kitchen', sort_order: 1, isActive: true },
    { name: 'Tableware', slug: 'tableware', description: 'Elegant dining and serving essentials', sort_order: 2, isActive: true },
    { name: 'Home Decor', slug: 'home-decor', description: 'Beautiful accents for your living space', sort_order: 3, isActive: true },
    { name: 'Outdoor & Garden', slug: 'outdoor-garden', description: 'Products for outdoor living', sort_order: 4, isActive: true },
    { name: 'Storage & Organization', slug: 'storage-organization', description: 'Keep your home tidy and organized', sort_order: 5, isActive: true },
    { name: 'Accessories', slug: 'accessories', description: 'Stylish accessories for every occasion', sort_order: 6, isActive: true },
  ];

  const createdCategories: { id: number; name: string }[] = [];
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    createdCategories.push(created);
  }
  console.log(`✅ ${categories.length} categories created`);

  // ============================================================================
  // 5. Create Subcategories
  // ============================================================================
  console.log('\nCreating subcategories...');

  const kitchenwareCat = createdCategories.find(c => c.name === 'Kitchenware');
  const tablewareCat = createdCategories.find(c => c.name === 'Tableware');
  const homeDecorCat = createdCategories.find(c => c.name === 'Home Decor');
  const outdoorCat = createdCategories.find(c => c.name === 'Outdoor & Garden');

  const subcategories = [
    { categoryId: kitchenwareCat!.id, name: 'Cookware', slug: 'cookware', sort_order: 1 },
    { categoryId: kitchenwareCat!.id, name: 'Bakeware', slug: 'bakeware', sort_order: 2 },
    { categoryId: kitchenwareCat!.id, name: 'Kitchen Tools', slug: 'kitchen-tools', sort_order: 3 },
    { categoryId: tablewareCat!.id, name: 'Dinnerware', slug: 'dinnerware', sort_order: 1 },
    { categoryId: tablewareCat!.id, name: 'Glassware', slug: 'glassware', sort_order: 2 },
    { categoryId: tablewareCat!.id, name: 'Flatware', slug: 'flatware', sort_order: 3 },
    { categoryId: homeDecorCat!.id, name: 'Vases & Planters', slug: 'vases-planters', sort_order: 1 },
    { categoryId: homeDecorCat!.id, name: 'Candles & Holders', slug: 'candles-holders', sort_order: 2 },
    { categoryId: outdoorCat!.id, name: 'Camping', slug: 'camping', sort_order: 1 },
    { categoryId: outdoorCat!.id, name: 'Garden Tools', slug: 'garden-tools', sort_order: 2 },
  ];

  let subcatCount = 0;
  for (const subcat of subcategories) {
    try {
      await prisma.subcategory.create({
        data: subcat,
      });
      subcatCount++;
    } catch (e) {
      // Already exists
    }
  }
  console.log(`✅ ${subcatCount} subcategories created`);

  // ============================================================================
  // 6. Create Products
  // ============================================================================
  console.log('\nCreating products...');

  const usaCountry = await prisma.country.findUnique({ where: { countryCode: 'USA' } });
  const chinaCountry = await prisma.country.findUnique({ where: { countryCode: 'CHN' } });
  const japanCountry = await prisma.country.findUnique({ where: { countryCode: 'JPN' } });
  
  const soloHomeBrand = createdBrands.find(b => b.name === 'Solo Home');
  const eliteKitchenBrand = createdBrands.find(b => b.name === 'Elite Kitchen');
  const outdoorProBrand = createdBrands.find(b => b.name === 'Outdoor Pro');
  const modernLivingBrand = createdBrands.find(b => b.name === 'Modern Living');
  
  const sarahDesigner = createdDesigners.find(d => d.name === 'Sarah Chen');
  const marcoDesigner = createdDesigners.find(d => d.name === 'Marco Rossi');
  const inHouseDesigner = createdDesigners.find(d => d.name === 'In-House Design');

  const products = [
    {
      sku: 'SOLO-PAN-001',
      slug: 'professional-non-stick-frying-pan',
      productName: 'Professional Non-Stick Frying Pan',
      description: 'High-quality non-stick frying pan with ergonomic handle. Perfect for everyday cooking.',
      brandId: eliteKitchenBrand!.id,
      designerId: sarahDesigner!.id,
      categoryId: kitchenwareCat!.id,
      countryId: usaCountry!.id,
      material: 'Aluminum with ceramic coating',
      colour: 'Black',
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'SOLO-PLATE-001',
      slug: 'ceramic-dinner-plate-set-4-pcs',
      productName: 'Ceramic Dinner Plate Set (4 pcs)',
      description: 'Elegant ceramic dinner plates, microwave and dishwasher safe.',
      brandId: soloHomeBrand!.id,
      designerId: marcoDesigner!.id,
      categoryId: tablewareCat!.id,
      countryId: chinaCountry!.id,
      material: 'Ceramic',
      colour: 'White',
      isActive: true,
      isNew: true,
    },
    {
      sku: 'SOLO-KNIFE-001',
      slug: 'chefs-knife-8-inch',
      productName: 'Chef\'s Knife - 8 inch',
      description: 'Professional grade chef knife with German steel blade.',
      brandId: eliteKitchenBrand!.id,
      designerId: inHouseDesigner!.id,
      categoryId: kitchenwareCat!.id,
      countryId: japanCountry!.id,
      material: 'German Steel',
      colour: 'Silver/Black',
      isActive: true,
      isBestSeller: true,
    },
    {
      sku: 'SOLO-GLASS-001',
      slug: 'crystal-wine-glass-set-6-pcs',
      productName: 'Crystal Wine Glass Set (6 pcs)',
      description: 'Lead-free crystal wine glasses for elegant dining.',
      brandId: soloHomeBrand!.id,
      designerId: marcoDesigner!.id,
      categoryId: tablewareCat!.id,
      countryId: chinaCountry!.id,
      material: 'Crystal Glass',
      colour: 'Clear',
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'SOLO-TENT-001',
      slug: '4-person-camping-tent',
      productName: '4-Person Camping Tent',
      description: 'Waterproof camping tent with easy setup. Perfect for family camping trips.',
      brandId: outdoorProBrand!.id,
      designerId: inHouseDesigner!.id,
      categoryId: outdoorCat!.id,
      countryId: chinaCountry!.id,
      material: 'Polyester',
      colour: 'Green',
      isActive: true,
      isNew: true,
    },
    {
      sku: 'SOLO-VASE-001',
      slug: 'modern-ceramic-vase',
      productName: 'Modern Ceramic Vase',
      description: 'Minimalist ceramic vase for flowers or decorative use.',
      brandId: modernLivingBrand!.id,
      designerId: sarahDesigner!.id,
      categoryId: homeDecorCat!.id,
      countryId: chinaCountry!.id,
      material: 'Ceramic',
      colour: 'Matte White',
      isActive: true,
    },
    {
      sku: 'SOLO-POT-001',
      slug: 'stainless-steel-stock-pot-8-qt',
      productName: 'Stainless Steel Stock Pot - 8 Qt',
      description: 'Heavy-duty stock pot for soups, stews, and more.',
      brandId: eliteKitchenBrand!.id,
      designerId: inHouseDesigner!.id,
      categoryId: kitchenwareCat!.id,
      countryId: usaCountry!.id,
      material: 'Stainless Steel',
      colour: 'Silver',
      isActive: true,
      isBestSeller: true,
    },
    {
      sku: 'SOLO-BOWL-001',
      slug: 'bamboo-salad-bowl-set',
      productName: 'Bamboo Salad Bowl Set',
      description: 'Eco-friendly bamboo salad bowls with serving utensils.',
      brandId: soloHomeBrand!.id,
      designerId: sarahDesigner!.id,
      categoryId: tablewareCat!.id,
      countryId: chinaCountry!.id,
      material: 'Bamboo',
      colour: 'Natural',
      isActive: true,
    },
    {
      sku: 'SOLO-CANDLE-001',
      slug: 'scented-candle-gift-set',
      productName: 'Scented Candle Gift Set',
      description: 'Set of 3 premium scented candles in decorative jars.',
      brandId: modernLivingBrand!.id,
      designerId: marcoDesigner!.id,
      categoryId: homeDecorCat!.id,
      countryId: usaCountry!.id,
      material: 'Soy Wax',
      colour: 'Assorted',
      isActive: true,
      isFeatured: true,
    },
    {
      sku: 'SOLO-BAG-001',
      slug: 'insulated-cooler-bag',
      productName: 'Insulated Cooler Bag',
      description: 'Large insulated bag for picnics and outdoor activities.',
      brandId: outdoorProBrand!.id,
      designerId: inHouseDesigner!.id,
      categoryId: outdoorCat!.id,
      countryId: chinaCountry!.id,
      material: 'Polyester with insulation',
      colour: 'Navy Blue',
      isActive: true,
      isNew: true,
    },
  ];

  let productCount = 0;
  for (const product of products) {
    try {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product,
      });
      productCount++;
    } catch (e) {
      console.error(`Error creating product ${product.sku}:`, e);
    }
  }
  console.log(`✅ ${productCount} products created`);

  // Add pricing for products
  console.log('\nCreating product pricing...');
  const allProducts = await prisma.product.findMany();
  
  const pricingData = [
    { sku: 'SOLO-PAN-001', price_excl_vat_aed: 49.99, price_incl_vat_aed: 52.49 },
    { sku: 'SOLO-PLATE-001', price_excl_vat_aed: 39.99, price_incl_vat_aed: 41.99 },
    { sku: 'SOLO-KNIFE-001', price_excl_vat_aed: 89.99, price_incl_vat_aed: 94.49 },
    { sku: 'SOLO-GLASS-001', price_excl_vat_aed: 59.99, price_incl_vat_aed: 62.99 },
    { sku: 'SOLO-TENT-001', price_excl_vat_aed: 199.99, price_incl_vat_aed: 209.99 },
    { sku: 'SOLO-VASE-001', price_excl_vat_aed: 34.99, price_incl_vat_aed: 36.74 },
    { sku: 'SOLO-POT-001', price_excl_vat_aed: 79.99, price_incl_vat_aed: 83.99 },
    { sku: 'SOLO-BOWL-001', price_excl_vat_aed: 44.99, price_incl_vat_aed: 47.24 },
    { sku: 'SOLO-CANDLE-001', price_excl_vat_aed: 29.99, price_incl_vat_aed: 31.49 },
    { sku: 'SOLO-BAG-001', price_excl_vat_aed: 54.99, price_incl_vat_aed: 57.74 },
  ];

  for (const pricing of pricingData) {
    const prod = allProducts.find(p => p.sku === pricing.sku);
    if (prod) {
      try {
        await prisma.productPricing.upsert({
          where: { productId: prod.id },
          update: {},
          create: {
            productId: prod.id,
            price_excl_vat_aed: pricing.price_excl_vat_aed,
            price_incl_vat_aed: pricing.price_incl_vat_aed,
            vatRate: 0.05,
          },
        });
      } catch (e) {
        // Already exists
      }
    }
  }
  console.log(`✅ Product pricing created`);

  console.log('\n🎉 Inventory database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

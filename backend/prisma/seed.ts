import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================================================
  // 1. Create Admin Users
  // ============================================================================
  console.log('Creating admin users...');
  
  // Main admin user (Aiman)
  const aimanPassword = await argon2.hash('Admin123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const aiman = await prisma.user.upsert({
    where: { email: 'aiman@solo-ecommerce.com' },
    update: {
      passwordHash: aimanPassword, // Update password if user exists
    },
    create: {
      email: 'aiman@solo-ecommerce.com',
      passwordHash: aimanPassword,
      firstName: 'Aiman',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Admin user Aiman created:', aiman.email);

  // Legacy admin user
  const adminPassword = await argon2.hash('AdminPassword123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@solo-ecommerce.com' },
    update: {},
    create: {
      email: 'admin@solo-ecommerce.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create test customer
  const customerPassword = await argon2.hash('Customer123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: customerPassword,
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+14155552671',
      role: 'CUSTOMER',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Test customer created:', customer.email);

  // Create cart for customer
  const existingCart = await prisma.cart.findFirst({ where: { userId: customer.id } });
  if (!existingCart) {
    await prisma.cart.create({ data: { userId: customer.id } });
  }

  // ============================================================================
  // 2. Departments (REMOVED - model no longer exists)
  // ============================================================================
  console.log('\nSkipping departments (model removed)...');

  // ============================================================================
  // 3. Categories - Create in both schemas
  // ============================================================================
  console.log('\nCreating categories...');

  const categories = [
    { name: 'Cookware', description: 'Pots, pans, and cooking essentials' },
    { name: 'Bakeware', description: 'Baking trays, molds, and accessories' },
    { name: 'Kitchen Tools', description: 'Utensils, gadgets, and helpers' },
    { name: 'Drinkware', description: 'Cups, mugs, and beverage containers' },
    { name: 'Food Storage', description: 'Containers and organization' },
    { name: 'Cutlery', description: 'Knives, forks, and eating utensils' },
    { name: 'Small Appliances', description: 'Blenders, mixers, and gadgets' },
    { name: 'Outdoor & Travel', description: 'Portable and travel-friendly items' },
  ];

  // Create in public schema (used by categories API)
  const createdCategories = [];
  for (const [index, cat] of categories.entries()) {
    const slug = cat.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
    const category = await prisma.category.upsert({
      where: { slug },
      update: { 
        name: cat.name, 
        description: cat.description,
      },
      create: {
        name: cat.name,
        slug,
        description: cat.description,
        sort_order: index,
        isActive: true,
      },
    });
    createdCategories.push(category);
  }

  console.log(`✅ ${createdCategories.length} categories created`);

  // ============================================================================
  // 4. Brands - Create public schema brands (used by API)
  // ============================================================================
  console.log('\nCreating brands...');

  const brands = [
    { name: 'Le Creuset', description: 'Premium French cookware' },
    { name: 'KitchenAid', description: 'Iconic kitchen appliances' },
    { name: 'OXO', description: 'Ergonomic kitchen tools' },
    { name: 'Lodge', description: 'Cast iron specialists' },
    { name: 'Pyrex', description: 'Glass bakeware and storage' },
    { name: 'Joseph Joseph', description: 'Innovative kitchen design' },
    { name: 'Cuisinart', description: 'Professional-grade equipment' },
    { name: 'All-Clad', description: 'Premium stainless steel cookware' },
  ];

  const createdBrands = [];
  for (const [index, brand] of brands.entries()) {
    const slug = brand.name.toLowerCase().replace(/\s+/g, '-');
    const created = await prisma.brand.upsert({
      where: { slug },
      update: { name: brand.name, description: brand.description },
      create: {
        name: brand.name,
        slug,
        description: brand.description,
        sort_order: index,
        isActive: true,
      },
    });
    createdBrands.push(created);
  }
  console.log(`✅ ${createdBrands.length} brands created`);

  // ============================================================================
  // 5. Products - Create inventory products
  // ============================================================================
  console.log('\nCreating products...');

  // Get created brand IDs by name
  const brandMap: Record<string, number> = {};
  for (const b of createdBrands) {
    brandMap[b.name] = b.id;
  }

  // Get created category IDs by name
  const categoryMap: Record<string, number> = {};
  for (const c of createdCategories) {
    categoryMap[c.name] = c.id;
  }

  const products = [
    // Cookware
    { 
      sku: 'LC-001', 
      name: 'Le Creuset Dutch Oven 5.5 Qt', 
      shortDesc: 'Iconic enameled cast iron Dutch oven',
      fullDesc: 'Iconic enameled cast iron Dutch oven perfect for slow cooking, braising, and baking. The smooth interior provides superior browning and the tight-fitting lid helps retain moisture and heat. Available in multiple vibrant colors.',
      category: 'Cookware', 
      brand: 'Le Creuset', 
      featured: true, 
      bestSeller: true, 
      price: 1299.00, 
      listPrice: 1499.00,
      highlights: ['Enameled cast iron', 'Lifetime durability', 'Compatible with all heat sources', 'Oven-safe to 500°F'],
      specs: [
        { key: 'Capacity', value: '5.5 Qt' },
        { key: 'Diameter', value: '10.25 inches' },
        { key: 'Weight', value: '6.5 lbs' },
        { key: 'Material', value: 'Cast Iron with enamel coating' }
      ],
      gallery: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400'],
      deliveryNote: 'Ships within 2-3 business days. Free shipping on orders over AED 500.',
      returnsNote: '30-day returns accepted in original condition. Return shipping paid by customer.',
      metaTitle: 'Le Creuset Dutch Oven 5.5 Qt | Premium Cookware',
      metaDesc: 'Iconic enameled cast iron Dutch oven. Lifetime quality and durability. Shop now.'
    },
    { 
      sku: 'LC-002', 
      name: 'Le Creuset Skillet 10.25"', 
      shortDesc: 'Cast iron skillet with superior heat retention',
      fullDesc: 'Professional-grade cast iron skillet with superior heat retention and distribution. The smooth cooking surface provides perfect browning for searing meats and caramelizing vegetables.',
      category: 'Cookware', 
      brand: 'Le Creuset', 
      featured: true, 
      price: 799.00, 
      listPrice: 899.00,
      highlights: ['Professional-grade', 'Even heat distribution', 'Naturally non-stick surface', 'Dishwasher safe'],
      specs: [
        { key: 'Size', value: '10.25 inches' },
        { key: 'Weight', value: '5.5 lbs' },
        { key: 'Heat Source', value: 'All surfaces including induction' },
        { key: 'Max Oven Temp', value: '500°F' }
      ],
      gallery: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Le Creuset Skillet | Premium Cast Iron',
      metaDesc: 'Professional cast iron skillet for perfect searing and cooking.'
    },
    { 
      sku: 'AC-001', 
      name: 'All-Clad D5 Fry Pan 12"', 
      shortDesc: '5-ply stainless steel for even heating',
      fullDesc: 'Premium 5-ply bonded stainless steel construction ensures even heat distribution and superior browning. Perfect for professional and home cooking.',
      category: 'Cookware', 
      brand: 'All-Clad', 
      bestSeller: true, 
      price: 549.00,
      highlights: ['5-ply construction', 'Stainless steel exterior', 'Riveted handles', 'Lifetime warranty'],
      specs: [
        { key: 'Size', value: '12 inches' },
        { key: 'Construction', value: '5-ply bonded steel' },
        { key: 'Weight', value: '3.2 lbs' },
        { key: 'Compatible', value: 'All cooktops including induction' }
      ],
      gallery: ['https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400'],
      deliveryNote: 'Ships within 1-2 business days.',
      returnsNote: 'Lifetime satisfaction guarantee.',
      metaTitle: 'All-Clad D5 Fry Pan | Professional Cookware',
      metaDesc: 'Premium 5-ply stainless steel fry pan for perfect cooking results.'
    },
    { 
      sku: 'LO-001', 
      name: 'Lodge Cast Iron Skillet 12"', 
      shortDesc: 'Pre-seasoned cast iron for perfect searing',
      fullDesc: 'Seasoned cast iron skillet ready to use right out of the box. Perfect for searing, frying, baking, and campfire cooking.',
      category: 'Cookware', 
      brand: 'Lodge', 
      featured: true, 
      bestSeller: true, 
      price: 149.00, 
      listPrice: 199.00,
      highlights: ['Pre-seasoned', 'Uses less oil', 'Improves with use', 'Budget-friendly'],
      specs: [
        { key: 'Size', value: '12 inches' },
        { key: 'Weight', value: '3.6 lbs' },
        { key: 'Material', value: 'Cast iron' },
        { key: 'Pre-seasoned', value: 'Yes' }
      ],
      gallery: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day satisfaction guarantee.',
      metaTitle: 'Lodge Cast Iron Skillet | Affordable Cookware',
      metaDesc: 'Pre-seasoned cast iron skillet for home and campfire cooking.'
    },
    
    // Bakeware - Products 5-6
    { 
      sku: 'PX-001', 
      name: 'Pyrex Glass Baking Dish Set', 
      shortDesc: '4-piece glass baking set for oven to table',
      fullDesc: 'Set of 4 tempered glass baking dishes in various sizes. Microwave, oven, and dishwasher safe. Goes from oven to table beautifully.',
      category: 'Bakeware', 
      brand: 'Pyrex', 
      bestSeller: true, 
      price: 189.00,
      highlights: ['Tempered glass', 'Set of 4 sizes', 'Oven to table', 'Lifetime warranty'],
      specs: [
        { key: 'Material', value: 'Borosilicate glass' },
        { key: 'Set Includes', value: '4 dishes in various sizes' },
        { key: 'Max Temp', value: '425°F' },
        { key: 'Safe For', value: 'Oven, microwave, freezer, dishwasher' }
      ],
      gallery: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: 'Lifetime warranty against manufacturing defects.',
      metaTitle: 'Pyrex Glass Baking Dish Set | 4-Piece',
      metaDesc: 'Tempered glass baking dishes - oven to table perfection.'
    },
    { 
      sku: 'PX-002', 
      name: 'Pyrex Mixing Bowl Set', 
      shortDesc: 'Nested glass bowls with lids',
      fullDesc: 'Set of 4 mixing bowls with lids in nested design for space-saving storage. Perfect for mixing, storing, and serving.',
      category: 'Bakeware', 
      brand: 'Pyrex', 
      featured: true, 
      price: 129.00, 
      listPrice: 159.00,
      highlights: ['Includes lids', 'Nested design', '4 different sizes', 'Microwave safe'],
      specs: [
        { key: 'Set Size', value: '4 bowls with lids' },
        { key: 'Material', value: 'Borosilicate glass' },
        { key: 'Safe For', value: 'Oven, microwave, dishwasher' },
        { key: 'Max Capacity', value: 'Largest 4.5 quarts' }
      ],
      gallery: ['https://images.unsplash.com/photo-1599599810694-b5ac4dd3c70b?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Pyrex Mixing Bowl Set | 4-Piece with Lids',
      metaDesc: 'Glass mixing bowls with lids for storage and serving.'
    },
    
    // Kitchen Tools - Products 7-9
    { 
      sku: 'OX-001', 
      name: 'OXO Good Grips 15-Piece Set', 
      shortDesc: 'Essential kitchen utensil set with soft-grip handles',
      fullDesc: 'Complete set of 15 kitchen utensils featuring OXO\'s signature soft-grip handles. Includes every tool you need for basic cooking and serving.',
      category: 'Kitchen Tools', 
      brand: 'OXO', 
      featured: true, 
      bestSeller: true, 
      price: 249.00,
      highlights: ['15-piece set', 'Ergonomic handles', 'Heat-resistant to 400°F', 'Hanging storage'],
      specs: [
        { key: 'Pieces', value: '15' },
        { key: 'Material', value: 'Nylon and silicone' },
        { key: 'Heat Resistant', value: '400°F' },
        { key: 'Includes', value: 'Spatulas, spoons, tongs, whisk, and more' }
      ],
      gallery: ['https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'OXO Good Grips 15-Piece Set | Kitchen Utensils',
      metaDesc: 'Complete kitchen utensil set with ergonomic soft-grip handles.'
    },
    { 
      sku: 'OX-002', 
      name: 'OXO Salad Spinner', 
      shortDesc: 'One-handed pump mechanism for easy drying',
      fullDesc: 'Efficient salad spinner with OXO\'s innovative one-handed pump mechanism. Dries lettuce and greens perfectly for salads.',
      category: 'Kitchen Tools', 
      brand: 'OXO', 
      bestSeller: true, 
      price: 119.00,
      highlights: ['One-handed operation', 'Pump mechanism', 'Non-slip feet', 'Easy to clean'],
      specs: [
        { key: 'Capacity', value: '5 liters' },
        { key: 'Operation', value: 'One-handed pump' },
        { key: 'Base', value: 'Non-slip rubber feet' },
        { key: 'Material', value: 'BPA-free plastic' }
      ],
      gallery: ['https://images.unsplash.com/photo-1610073711055-29a1ae81fc58?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'OXO Salad Spinner | One-Handed Operation',
      metaDesc: 'Efficient salad spinner for perfectly dried greens.'
    },
    { 
      sku: 'JJ-001', 
      name: 'Joseph Joseph Nest Utensils', 
      shortDesc: 'Space-saving nested cooking tools',
      fullDesc: 'Innovative nested design utensils that save 50% cabinet space. Perfect for small kitchens and modern homes.',
      category: 'Kitchen Tools', 
      brand: 'Joseph Joseph', 
      featured: true, 
      price: 179.00,
      highlights: ['Saves 50% space', 'Nested design', 'Heat-resistant silicone', 'Beautiful aesthetics'],
      specs: [
        { key: 'Set Size', value: '6 tools' },
        { key: 'Material', value: 'Silicone and stainless steel' },
        { key: 'Heat Resistant', value: '400°F' },
        { key: 'Space Saving', value: 'Nested design' }
      ],
      gallery: ['https://images.unsplash.com/photo-1578519315728-4537a2e9c85f?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Joseph Joseph Nest Utensils | Space-Saving Design',
      metaDesc: 'Innovative nested utensils that save kitchen space.'
    },
    
    // Drinkware - Products 10-11
    { 
      sku: 'LC-003', 
      name: 'Le Creuset Mug Set', 
      shortDesc: 'Set of 4 stoneware mugs in classic colors',
      fullDesc: 'Beautiful set of 4 stoneware mugs in classic Le Creuset colors. Perfect for coffee, tea, or hot chocolate. Microwave and dishwasher safe.',
      category: 'Drinkware', 
      brand: 'Le Creuset', 
      featured: true, 
      price: 229.00,
      highlights: ['Set of 4', 'Stoneware', 'Microwave safe', 'Dishwasher safe'],
      specs: [
        { key: 'Set Size', value: '4 mugs' },
        { key: 'Capacity', value: '14 oz each' },
        { key: 'Material', value: 'Stoneware' },
        { key: 'Colors', value: 'Assorted Le Creuset classics' }
      ],
      gallery: ['https://images.unsplash.com/photo-1606312519331-379a858e3cb2?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Le Creuset Mug Set | 4-Piece Stoneware',
      metaDesc: 'Classic Le Creuset stoneware mugs for everyday enjoyment.'
    },
    { 
      sku: 'JJ-002', 
      name: 'Joseph Joseph Drink Bottle', 
      shortDesc: 'Leak-proof travel bottle with infuser',
      fullDesc: 'Innovative leak-proof drink bottle with built-in fruit infuser. Perfect for staying hydrated while traveling or at the gym.',
      category: 'Drinkware', 
      brand: 'Joseph Joseph', 
      isNew: true, 
      price: 79.00,
      highlights: ['Leak-proof', 'Fruit infuser', 'Durable plastic', 'Easy to clean'],
      specs: [
        { key: 'Capacity', value: '600 ml' },
        { key: 'Material', value: 'BPA-free plastic' },
        { key: 'Features', value: 'Built-in infuser basket' },
        { key: 'Colors', value: 'Multiple colors available' }
      ],
      gallery: ['https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=400'],
      deliveryNote: 'Ships within 1-2 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Joseph Joseph Drink Bottle | Leak-Proof with Infuser',
      metaDesc: 'Leak-proof bottle with fruit infuser for on-the-go hydration.'
    },
    
    // Food Storage - Products 12-14
    { 
      sku: 'PX-003', 
      name: 'Pyrex Storage Set 18-Piece', 
      shortDesc: 'Glass containers with snap-lock lids',
      fullDesc: 'Comprehensive set of 18 glass food storage containers with snap-lock lids. Perfect for meal prep and organized storage.',
      category: 'Food Storage', 
      brand: 'Pyrex', 
      bestSeller: true, 
      price: 199.00,
      highlights: ['18 containers', 'Snap-lock lids', 'Glass construction', 'Freezer safe'],
      specs: [
        { key: 'Set Size', value: '18 containers with lids' },
        { key: 'Material', value: 'Borosilicate glass' },
        { key: 'Safe For', value: 'Oven, microwave, freezer, dishwasher' },
        { key: 'Lid Type', value: 'Snap-lock plastic' }
      ],
      gallery: ['https://images.unsplash.com/photo-1578302154949-3d5f5ab90c20?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Pyrex Storage Set | 18-Piece with Snap-Lock Lids',
      metaDesc: 'Complete glass container set for food storage and meal prep.'
    },
    { 
      sku: 'JJ-003', 
      name: 'Joseph Joseph Nest Lock Containers', 
      shortDesc: 'Stackable storage with leak-proof lids',
      fullDesc: 'Innovative nested storage containers that stack smartly. Leak-proof lids keep food fresh and secure.',
      category: 'Food Storage', 
      brand: 'Joseph Joseph', 
      isNew: true, 
      price: 159.00,
      highlights: ['Space-saving', 'Leak-proof', 'Transparent lids', '4-piece set'],
      specs: [
        { key: 'Set Size', value: '4 containers' },
        { key: 'Material', value: 'BPA-free plastic' },
        { key: 'Lids', value: 'Leak-proof' },
        { key: 'Design', value: 'Nested/stackable' }
      ],
      gallery: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400'],
      deliveryNote: 'Ships within 1-2 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Joseph Joseph Nest Lock Containers | Food Storage',
      metaDesc: 'Innovative stackable containers with leak-proof lids.'
    },
    { 
      sku: 'OX-003', 
      name: 'OXO POP Container Set', 
      shortDesc: 'Airtight containers for pantry organization',
      fullDesc: 'Easy-to-use pop-open lids for simple access. Airtight seals keep ingredients fresh. Perfect for cereal, flour, sugar, and dry goods.',
      category: 'Food Storage', 
      brand: 'OXO', 
      featured: true, 
      bestSeller: true, 
      price: 329.00, 
      listPrice: 399.00,
      highlights: ['Pop-open lids', 'Airtight seals', 'Stackable', 'Assorted sizes'],
      specs: [
        { key: 'Set Size', value: 'Multiple sizes' },
        { key: 'Material', value: 'BPA-free plastic' },
        { key: 'Seal Type', value: 'Airtight' },
        { key: 'Lid Operation', value: 'One-handed pop-open' }
      ],
      gallery: ['https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'OXO POP Container Set | Airtight Food Storage',
      metaDesc: 'Smart food storage containers with pop-open airtight lids.'
    },
    
    // Small Appliances - Products 15-18
    { 
      sku: 'KA-001', 
      name: 'KitchenAid Artisan Stand Mixer', 
      shortDesc: '10-speed tilt-head stand mixer in Empire Red',
      fullDesc: 'Professional-quality 10-speed stand mixer. Tilt-head design allows easy access to the bowl. Includes flat mixing paddle, dough hook, and wire whip.',
      category: 'Small Appliances', 
      brand: 'KitchenAid', 
      featured: true, 
      bestSeller: true, 
      price: 1899.00, 
      listPrice: 2199.00,
      highlights: ['10 speeds', 'Tilt-head design', 'Powerful motor', 'Color options'],
      specs: [
        { key: 'Power', value: '300 watts' },
        { key: 'Speeds', value: '10' },
        { key: 'Bowl Capacity', value: '5 quarts' },
        { key: 'Design', value: 'Tilt-head' }
      ],
      gallery: ['https://images.unsplash.com/photo-1599599810980-750fc23c9d13?w=400'],
      deliveryNote: 'Ships within 3-5 business days.',
      returnsNote: '30-day returns accepted. 1-year manufacturer warranty.',
      metaTitle: 'KitchenAid Artisan Stand Mixer | Professional Quality',
      metaDesc: 'Iconic stand mixer for baking and mixing. 10-speed tilt-head design.'
    },
    { 
      sku: 'KA-002', 
      name: 'KitchenAid Hand Mixer', 
      shortDesc: '9-speed digital hand mixer',
      fullDesc: 'Compact hand mixer with 9 speeds and digital display. Perfect for smaller mixing tasks and portable kitchen use.',
      category: 'Small Appliances', 
      brand: 'KitchenAid', 
      isNew: true, 
      price: 349.00,
      highlights: ['9 speeds', 'Digital display', 'Lightweight', 'Easy control'],
      specs: [
        { key: 'Speeds', value: '9' },
        { key: 'Display', value: 'Digital' },
        { key: 'Attachments', value: 'Beaters and dough hooks' },
        { key: 'Weight', value: 'Lightweight and portable' }
      ],
      gallery: ['https://images.unsplash.com/photo-1599599810694-b5ac4dd3c70b?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'KitchenAid Hand Mixer | 9-Speed Digital',
      metaDesc: 'Compact hand mixer with digital controls for flexible mixing.'
    },
    { 
      sku: 'CU-001', 
      name: 'Cuisinart Food Processor 14-Cup', 
      shortDesc: 'Powerful motor with multiple blades',
      fullDesc: 'Professional 14-cup capacity food processor with powerful motor. Multiple blades and discs for chopping, mixing, and more.',
      category: 'Small Appliances', 
      brand: 'Cuisinart', 
      featured: true, 
      price: 699.00, 
      listPrice: 799.00,
      highlights: ['14-cup capacity', 'Powerful motor', 'Multiple blades', 'Easy cleanup'],
      specs: [
        { key: 'Capacity', value: '14 cups' },
        { key: 'Motor Power', value: '600 watts' },
        { key: 'Speeds', value: 'Variable pulse and on/off' },
        { key: 'Accessories', value: 'Multiple blades and discs' }
      ],
      gallery: ['https://images.unsplash.com/photo-1577099519625-06d213ce88e4?w=400'],
      deliveryNote: 'Ships within 3-5 business days.',
      returnsNote: '30-day returns accepted. 3-year manufacturer warranty.',
      metaTitle: 'Cuisinart Food Processor | 14-Cup Capacity',
      metaDesc: 'Powerful food processor for chopping, mixing, and food prep.'
    },
    { 
      sku: 'CU-002', 
      name: 'Cuisinart Immersion Blender', 
      shortDesc: 'Smart Stick hand blender with attachments',
      fullDesc: 'Cordless immersion blender with variable speed and multiple attachments. Perfect for soups, smoothies, and sauces.',
      category: 'Small Appliances', 
      brand: 'Cuisinart', 
      isNew: true, 
      price: 249.00,
      highlights: ['Variable speed', 'Multiple attachments', 'Cordless', 'Ergonomic design'],
      specs: [
        { key: 'Power', value: '200 watts' },
        { key: 'Speeds', value: 'Variable' },
        { key: 'Attachments', value: 'Blender, whisk, chopper' },
        { key: 'Design', value: 'Cordless and lightweight' }
      ],
      gallery: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Cuisinart Immersion Blender | Hand Blender with Attachments',
      metaDesc: 'Versatile cordless hand blender for soups and smoothies.'
    },
    
    // Outdoor & Travel - Products 19-20
    { 
      sku: 'LO-002', 
      name: 'Lodge Camp Dutch Oven', 
      shortDesc: 'Seasoned cast iron for campfire cooking',
      fullDesc: 'Pre-seasoned cast iron Dutch oven perfect for camping and outdoor cooking. Use it over a campfire or on a stovetop.',
      category: 'Outdoor & Travel', 
      brand: 'Lodge', 
      featured: true, 
      price: 279.00,
      highlights: ['Pre-seasoned', 'Campfire ready', 'Lid doubles as skillet', 'Durable'],
      specs: [
        { key: 'Capacity', value: '4.5 quarts' },
        { key: 'Material', value: 'Cast iron' },
        { key: 'Design', value: 'Flat lid for cooking' },
        { key: 'Use', value: 'Campfire, stovetop, oven' }
      ],
      gallery: ['https://images.unsplash.com/photo-1565636192335-14c46fa1120b?w=400'],
      deliveryNote: 'Ships within 2-3 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Lodge Camp Dutch Oven | Camping Cookware',
      metaDesc: 'Pre-seasoned cast iron for campfire and outdoor cooking.'
    },
    { 
      sku: 'JJ-004', 
      name: 'Joseph Joseph Picnic Set', 
      shortDesc: 'Compact dining set for outdoor adventures',
      fullDesc: 'Complete picnic set with plates, utensils, and cups. Compact design perfect for outdoor adventures and travel.',
      category: 'Outdoor & Travel', 
      brand: 'Joseph Joseph', 
      isNew: true, 
      price: 189.00,
      highlights: ['Complete set', 'Compact design', 'Durable plastic', 'Travel-friendly'],
      specs: [
        { key: 'Includes', value: 'Plates, bowls, utensils, cups' },
        { key: 'Material', value: 'BPA-free plastic' },
        { key: 'Set Size', value: '4 place settings' },
        { key: 'Storage', value: 'Compact carrying case' }
      ],
      gallery: ['https://images.unsplash.com/photo-1565636192335-14c46fa1120b?w=400'],
      deliveryNote: 'Ships within 1-2 business days.',
      returnsNote: '30-day returns accepted.',
      metaTitle: 'Joseph Joseph Picnic Set | Outdoor Dining',
      metaDesc: 'Compact picnic set for outdoor adventures and travel.'
    },
  ];

  let productCount = 0;
  for (const prod of products) {
    const slug = prod.sku.toLowerCase() + '-' + prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const existing = await prisma.product.findUnique({ where: { sku: prod.sku } });
    
    let productId: number;
    
    if (existing) {
      await prisma.product.update({
        where: { sku: prod.sku },
        data: {
          productName: prod.name,
          shortDescription: prod.shortDesc,
          fullDescription: prod.fullDesc,
          description: prod.fullDesc,
          highlights: prod.highlights,
          specs: prod.specs,
          deliveryNote: prod.deliveryNote,
          returnsNote: prod.returnsNote,
          metaTitle: prod.metaTitle,
          metaDescription: prod.metaDesc,
        },
      });
      productId = existing.id;
    } else {
      const newProduct = await prisma.product.create({
        data: {
          sku: prod.sku,
          slug,
          productName: prod.name,
          shortDescription: prod.shortDesc,
          fullDescription: prod.fullDesc,
          description: prod.fullDesc,
          highlights: prod.highlights,
          specs: prod.specs,
          deliveryNote: prod.deliveryNote,
          returnsNote: prod.returnsNote,
          metaTitle: prod.metaTitle,
          metaDescription: prod.metaDesc,
          categoryId: categoryMap[prod.category] ?? null,
          brandId: brandMap[prod.brand] ?? null,
          isActive: true,
          isFeatured: prod.featured ?? false,
          isBestSeller: prod.bestSeller ?? false,
          isNew: prod.isNew ?? false,
        },
      });
      productId = newProduct.id;
    }
    
    // Create or update pricing for product
    const priceIncl = prod.price;
    const vatRate = 0.05;
    const priceExcl = Math.round((priceIncl / (1 + vatRate)) * 100) / 100;
    await prisma.productPricing.upsert({
      where: { productId: productId },
      update: {
        price_incl_vat_aed: priceIncl,
        price_excl_vat_aed: priceExcl,
      },
      create: {
        productId: productId,
        price_incl_vat_aed: priceIncl,
        price_excl_vat_aed: priceExcl,
        vatRate: vatRate,
        isCurrent: true,
      },
    });
    
    productCount++;
  }
  console.log(`✅ ${productCount} products created with pricing and product page fields`);

  // ============================================================================
  // 6. Create Sample Banners (3 HOME_HERO for homepage)
  // ============================================================================
  console.log('\nCreating banners...');

  const banners = [
    {
      placement: 'HOME_HERO',
      title: 'Welcome to Solo Ecommerce',
      subtitle: 'Discover premium products for your lifestyle',
      imageDesktopUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920',
      imageMobileUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      ctaUrl: '/products',
      ctaText: 'Shop Now',
      displayOrder: 1,
    },
    {
      placement: 'HOME_HERO',
      title: 'New Arrivals',
      subtitle: 'Check out our latest additions to the collection',
      imageDesktopUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920',
      imageMobileUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      ctaUrl: '/new-arrivals',
      ctaText: 'Explore',
      displayOrder: 2,
    },
    {
      placement: 'HOME_HERO',
      title: 'Best Sellers',
      subtitle: 'Our most loved products, handpicked for quality',
      imageDesktopUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=1920',
      imageMobileUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800',
      ctaUrl: '/best-sellers',
      ctaText: 'Shop Best Sellers',
      displayOrder: 3,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: `banner-${banner.displayOrder}` },
      update: {
        title: banner.title,
        subtitle: banner.subtitle,
        imageDesktopUrl: banner.imageDesktopUrl,
        imageMobileUrl: banner.imageMobileUrl,
        ctaUrl: banner.ctaUrl,
        ctaText: banner.ctaText,
        isActive: true,
      },
      create: {
        id: `banner-${banner.displayOrder}`,
        placement: banner.placement as any,
        title: banner.title,
        subtitle: banner.subtitle,
        imageDesktopUrl: banner.imageDesktopUrl,
        imageMobileUrl: banner.imageMobileUrl,
        ctaUrl: banner.ctaUrl,
        ctaText: banner.ctaText,
        displayOrder: banner.displayOrder,
        isActive: true,
      },
    });
  }

  console.log('✅ 3 HOME_HERO banners created');

  // ============================================================================
  // 7. Create Home Landing Page with Porto-style Sections
  // ============================================================================
  console.log('\nCreating home landing page with Porto-style sections...');

  // Delete existing home page if it exists (to reset sections)
  await prisma.landingPage.deleteMany({ where: { slug: 'home' } });

  const homePage = await prisma.landingPage.create({
    data: {
      slug: 'home',
      title: 'Home',
      seoTitle: 'Solo E-commerce - Premium Kitchen & Home Goods',
      seoDescription: 'Discover our curated collection of premium kitchenware, cookware, and home essentials from top brands.',
      isActive: true,
    },
  });

  // Create Porto-style sections for the home page
  const homePageSections = [
    {
      type: 'HERO',
      title: 'Elevate Your Kitchen',
      subtitle: 'Premium cookware and accessories for the modern chef',
      displayOrder: 0,
      data: JSON.stringify({
        slides: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920',
            mobileImageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
            title: 'Elevate Your Kitchen',
            subtitle: 'Premium cookware and accessories for the modern chef',
            ctaText: 'Shop Now',
            ctaUrl: '/category/cookware',
            alignment: 'center',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920',
            mobileImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            title: 'New Arrivals',
            subtitle: 'Discover our latest collection',
            ctaText: 'Explore',
            ctaUrl: '/new-arrivals',
            alignment: 'left',
          },
        ],
        autoPlay: true,
        interval: 5000,
      }),
      config: JSON.stringify({
        height: 600,
        mobileHeight: 400,
        showDots: true,
        showArrows: true,
      }),
    },
    {
      type: 'CATEGORY_TILES',
      title: 'Shop by Collection',
      displayOrder: 1,
      data: JSON.stringify({
        tiles: [
          {
            title: 'Cookware',
            imageUrl: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600',
            linkUrl: '/category/cookware',
          },
          {
            title: 'Bakeware',
            imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
            linkUrl: '/category/bakeware',
          },
          {
            title: 'Kitchen Tools',
            imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600',
            linkUrl: '/category/kitchen-tools',
          },
          {
            title: 'Small Appliances',
            imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600',
            linkUrl: '/category/small-appliances',
          },
        ],
      }),
      config: JSON.stringify({
        columns: 4,
        mobileColumns: 2,
        aspectRatio: 1.2,
        showTitle: true,
        overlayOpacity: 0.3,
      }),
    },
    {
      type: 'CATEGORY_GRID',
      title: 'Shop by Category',
      subtitle: 'Discover our meticulously selected professional collections',
      displayOrder: 2,
      data: JSON.stringify({
        source: 'all', // or categoryIds: [1, 2, 3]
        limit: 8,
      }),
      config: JSON.stringify({
        columns: 4,
        mobileColumns: 2,
        showDescription: false,
        cardStyle: 'minimal', // or 'elevated', 'bordered'
      }),
    },
    {
      type: 'PRODUCT_CAROUSEL',
      title: 'Best Sellers',
      subtitle: 'Our most popular products',
      displayOrder: 3,
      data: JSON.stringify({
        source: 'best_sellers',
        limit: 12,
      }),
      config: JSON.stringify({
        itemsPerView: 4,
        mobileItemsPerView: 2,
        showArrows: true,
        showDots: false,
        autoPlay: false,
      }),
    },
    {
      type: 'PROMO_BANNER',
      title: 'Free Shipping',
      subtitle: 'On orders over AED 500',
      displayOrder: 4,
      data: JSON.stringify({
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-d0f7a906c0c9?w=1200',
        ctaText: 'Shop Now',
        ctaUrl: '/products',
        alignment: 'center',
      }),
      config: JSON.stringify({
        height: 300,
        mobileHeight: 200,
        fullWidth: true,
      }),
    },
    {
      type: 'PRODUCT_CAROUSEL',
      title: 'New Arrivals',
      subtitle: 'Fresh additions to our collection',
      displayOrder: 5,
      data: JSON.stringify({
        source: 'new_arrivals',
        limit: 12,
      }),
      config: JSON.stringify({
        itemsPerView: 4,
        mobileItemsPerView: 2,
        showArrows: true,
        showDots: false,
        autoPlay: false,
      }),
    },
    {
      type: 'BRAND_STRIP',
      title: 'Our Brands',
      displayOrder: 6,
      data: JSON.stringify({
        source: 'all', // or brandIds: [1, 2, 3]
        limit: 8,
      }),
      config: JSON.stringify({
        scrollable: true,
        showNames: false,
        logoHeight: 60,
        spacing: 40,
        backgroundColor: '#f9f9f9',
      }),
    },
    {
      type: 'PRODUCT_CAROUSEL',
      title: 'Featured Products',
      subtitle: 'Handpicked favorites',
      displayOrder: 7,
      data: JSON.stringify({
        source: 'featured',
        limit: 8,
      }),
      config: JSON.stringify({
        itemsPerView: 4,
        mobileItemsPerView: 2,
        showArrows: true,
        showDots: false,
        autoPlay: false,
      }),
    },
  ];

  for (const section of homePageSections) {
    await prisma.landingSection.create({
      data: {
        landingPageId: homePage.id,
        type: section.type as any,
        title: section.title,
        subtitle: section.subtitle,
        data: section.data,
        config: section.config,
        displayOrder: section.displayOrder,
        isActive: true,
      },
    });
  }

  console.log(`✅ Home page created with ${homePageSections.length} Porto-style sections`);

  // ============================================================================
  // 9. Create Navigation Menus
  // ============================================================================
  console.log('\nCreating navigation menus...');

  // Main navigation menu
  const mainNavMenu = await prisma.navigationMenu.upsert({
    where: { key: 'main-nav' },
    update: {},
    create: {
      key: 'main-nav',
      name: 'Main Navigation',
      isActive: true,
    },
  });

  // Main nav items
  const mainNavItems = [
    { label: 'Home', url: '/', sortOrder: 0 },
    { label: 'Shop', url: '/products', sortOrder: 1 },
    { label: 'Categories', url: '/categories', sortOrder: 2 },
    { label: 'Brands', url: '/brands', sortOrder: 3 },
    { label: 'New Arrivals', url: '/new-arrivals', badge: 'NEW', badgeColor: '#dc3545', sortOrder: 4 },
    { label: 'Sale', url: '/sale', badge: 'HOT', badgeColor: '#fd7e14', sortOrder: 5 },
    { label: 'Blog', url: '/blog', sortOrder: 6 },
  ];

  for (const item of mainNavItems) {
    await prisma.navigationMenuItem.upsert({
      where: { id: `main-nav-${item.sortOrder}` },
      update: { label: item.label, url: item.url, badge: item.badge, badgeColor: item.badgeColor },
      create: {
        id: `main-nav-${item.sortOrder}`,
        menuId: mainNavMenu.id,
        label: item.label,
        url: item.url,
        badge: item.badge,
        badgeColor: item.badgeColor,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  // Top links menu
  const topLinksMenu = await prisma.navigationMenu.upsert({
    where: { key: 'top-links' },
    update: {},
    create: {
      key: 'top-links',
      name: 'Top Links',
      isActive: true,
    },
  });

  const topLinks = [
    { label: 'About Us', url: '/about', sortOrder: 0 },
    { label: 'Contact', url: '/contact', sortOrder: 1 },
    { label: 'FAQs', url: '/faqs', sortOrder: 2 },
  ];

  for (const item of topLinks) {
    await prisma.navigationMenuItem.upsert({
      where: { id: `top-links-${item.sortOrder}` },
      update: { label: item.label, url: item.url },
      create: {
        id: `top-links-${item.sortOrder}`,
        menuId: topLinksMenu.id,
        label: item.label,
        url: item.url,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  // Footer menu
  const footerMenu = await prisma.navigationMenu.upsert({
    where: { key: 'footer-nav' },
    update: {},
    create: {
      key: 'footer-nav',
      name: 'Footer Navigation',
      isActive: true,
    },
  });

  console.log('✅ Navigation menus created');

  // ============================================================================
  // 10. Create Product Collections
  // ============================================================================
  console.log('\nCreating product collections...');

  const collections = [
    { key: 'featured', title: 'Featured Products', subtitle: 'Handpicked favorites', strategy: 'FEATURED' as const, limit: 12 },
    { key: 'new-arrivals', title: 'New Arrivals', subtitle: 'Fresh additions to our collection', strategy: 'NEWEST' as const, limit: 12 },
    { key: 'best-sellers', title: 'Best Sellers', subtitle: 'Our most popular products', strategy: 'BEST_SELLING' as const, limit: 12 },
    { key: 'on-sale', title: 'On Sale', subtitle: 'Great deals on top products', strategy: 'ON_SALE' as const, limit: 12 },
  ];

  for (const [index, coll] of collections.entries()) {
    await prisma.productCollection.upsert({
      where: { key: coll.key },
      update: { title: coll.title, subtitle: coll.subtitle, strategy: coll.strategy, limit: coll.limit },
      create: {
        key: coll.key,
        title: coll.title,
        subtitle: coll.subtitle,
        strategy: coll.strategy,
        limit: coll.limit,
        sortOrder: index,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${collections.length} product collections created`);

  // ============================================================================
  // 11. Create Blog Categories and Sample Posts
  // ============================================================================
  console.log('\nCreating blog content...');

  const blogCategories = [
    { name: 'Recipes', slug: 'recipes', description: 'Delicious recipes for your kitchen' },
    { name: 'Tips & Tricks', slug: 'tips-tricks', description: 'Kitchen hacks and cooking tips' },
    { name: 'Product Guides', slug: 'product-guides', description: 'How to choose and use our products' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Living well with quality kitchenware' },
  ];

  const createdBlogCategories: Record<string, any> = {};
  for (const [index, cat] of blogCategories.entries()) {
    const blogCat = await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: index,
        isActive: true,
      },
    });
    createdBlogCategories[cat.slug] = blogCat;
  }

  // Create sample blog posts
  const blogPosts = [
    {
      title: '10 Essential Kitchen Tools Every Home Cook Needs',
      slug: 'essential-kitchen-tools',
      categorySlug: 'product-guides',
      excerpt: 'Discover the must-have tools that will transform your cooking experience.',
      content: '<p>Whether you\'re a beginner or an experienced home cook, having the right tools makes all the difference...</p>',
      featuredImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      author: 'Solo Team',
      readTimeMinutes: 5,
      isFeatured: true,
    },
    {
      title: 'How to Care for Your Cast Iron Cookware',
      slug: 'cast-iron-care-guide',
      categorySlug: 'tips-tricks',
      excerpt: 'Learn the secrets to keeping your cast iron in perfect condition for generations.',
      content: '<p>Cast iron cookware is an investment that can last a lifetime with proper care...</p>',
      featuredImage: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
      author: 'Solo Team',
      readTimeMinutes: 7,
      isFeatured: true,
    },
    {
      title: 'Perfect One-Pot Sunday Dinner',
      slug: 'one-pot-sunday-dinner',
      categorySlug: 'recipes',
      excerpt: 'A delicious and easy recipe for a hearty family meal using your Dutch oven.',
      content: '<p>Sunday dinners should be special, but they don\'t have to be complicated...</p>',
      featuredImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
      author: 'Solo Team',
      readTimeMinutes: 10,
      isFeatured: false,
    },
  ];

  for (const post of blogPosts) {
    const categoryId = createdBlogCategories[post.categorySlug]?.id;
    if (categoryId) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: {},
        create: {
          categoryId,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featuredImage: post.featuredImage,
          author: post.author,
          readTimeMinutes: post.readTimeMinutes,
          isFeatured: post.isFeatured,
          isActive: true,
          publishedAt: new Date(),
        },
      });
    }
  }

  console.log(`✅ ${blogCategories.length} blog categories and ${blogPosts.length} posts created`);

  // ============================================================================
  // 12. Create Site Settings
  // ============================================================================
  console.log('\nCreating site settings...');

  const siteSettings = [
    // Header settings
    { key: 'header.promoBar.text', value: '🎉 Free Shipping on Orders Over AED 500! Use code: FREESHIP', type: 'string', group: 'header' },
    { key: 'header.promoBar.enabled', value: 'true', type: 'boolean', group: 'header' },
    { key: 'header.promoBar.dismissable', value: 'true', type: 'boolean', group: 'header' },
    { key: 'header.phone', value: '+971 4 123 4567', type: 'string', group: 'header' },
    { key: 'header.logo', value: '/images/logo.svg', type: 'string', group: 'header' },
    
    // Footer settings
    { key: 'footer.copyright', value: '© 2024 Solo E-commerce. All rights reserved.', type: 'string', group: 'footer' },
    { key: 'footer.address', value: 'Dubai, United Arab Emirates', type: 'string', group: 'footer' },
    { key: 'footer.email', value: 'hello@solo-ecommerce.com', type: 'string', group: 'footer' },
    { key: 'footer.phone', value: '+971 4 123 4567', type: 'string', group: 'footer' },
    
    // Social links
    { key: 'social.facebook', value: 'https://facebook.com/solo', type: 'string', group: 'social' },
    { key: 'social.instagram', value: 'https://instagram.com/solo', type: 'string', group: 'social' },
    { key: 'social.twitter', value: 'https://twitter.com/solo', type: 'string', group: 'social' },
    
    // General
    { key: 'site.name', value: 'Solo E-commerce', type: 'string', group: 'general' },
    { key: 'site.tagline', value: 'Premium Kitchen & Home Goods', type: 'string', group: 'general' },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
        type: setting.type,
        group: setting.group,
      },
    });
  }

  console.log(`✅ ${siteSettings.length} site settings created`);

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📋 Summary:');
  console.log(`   - Admin user: admin@solo-ecommerce.com (password: AdminPassword123!)`);
  console.log(`   - Admin user: aiman@solo-ecommerce.com (password: Admin123)`);
  console.log(`   - Test customer: customer@example.com (password: Customer123!)`);
  console.log(`   - departments (removed)`);
  console.log(`   - ${createdCategories.length} categories`);
  console.log(`   - ${createdBrands.length} brands`);
  console.log(`   - ${productCount} products`);
  console.log(`   - ${homePageSections.length} home page sections`);
  console.log(`   - ${collections.length} product collections`);
  console.log(`   - ${blogPosts.length} blog posts`);
  console.log('\n✨ You can now start the backend with: npm run start:dev\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * E2E Test Database Setup Script
 * 
 * This script prepares the test database with:
 * 1. Schema migrations (prisma migrate deploy)
 * 2. Test seed data
 * 
 * Usage: npm run test:e2e:setup
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

async function setup() {
  console.log('🔧 Setting up E2E Test Database...\n');

  // Step 1: Run migrations
  console.log('📦 Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    });
    console.log('✅ Migrations applied successfully\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  // Step 2: Generate Prisma client
  console.log('🔨 Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated\n');
  } catch (error) {
    console.error('❌ Prisma generate failed:', error);
    process.exit(1);
  }

  // Step 3: Seed test data
  console.log('🌱 Seeding test data...');
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });

  try {
    // Clean up any stale test data
    await cleanupTestData(prisma);

    // Create test admin user
    const adminPassword = await argon2.hash('AdminTest123!', { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: 'e2e-admin@test.com' },
      update: { passwordHash: adminPassword },
      create: {
        email: 'e2e-admin@test.com',
        passwordHash: adminPassword,
        firstName: 'E2E',
        lastName: 'Admin',
        role: 'ADMIN',
        emailVerified: true,
        isActive: true,
      },
    });

    // Create test customer user
    const customerPassword = await argon2.hash('CustomerTest123!', { type: argon2.argon2id });
    const customer = await prisma.user.upsert({
      where: { email: 'e2e-customer@test.com' },
      update: { passwordHash: customerPassword },
      create: {
        email: 'e2e-customer@test.com',
        passwordHash: customerPassword,
        firstName: 'E2E',
        lastName: 'Customer',
        role: 'CUSTOMER',
        emailVerified: true,
        isActive: true,
      },
    });

    // Create cart for customer
    const existingCart = await prisma.cart.findFirst({ where: { userId: customer.id } });
    if (!existingCart) {
      await prisma.cart.create({ data: { userId: customer.id } });
    }

    // Create test categories (department model removed)
    for (let i = 1; i <= 3; i++) {
      await prisma.category.upsert({
        where: { slug: `e2e-test-category-${i}` },
        update: {},
        create: {
          name: `E2E Test Category ${i}`,
          slug: `e2e-test-category-${i}`,
          sort_order: i,
          isActive: true,
        },
      });
    }

    // Create test landing page
    await prisma.landingPage.upsert({
      where: { slug: 'e2e-test-page' },
      update: {},
      create: {
        title: 'E2E Test Page',
        slug: 'e2e-test-page',
        isActive: true,
        seoTitle: 'E2E Test',
        seoDescription: 'E2E Test Page',
      },
    });

    console.log('✅ Test data seeded successfully\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  console.log('🎉 E2E Test Database setup complete!\n');
}

async function cleanupTestData(prisma: PrismaClient) {
  console.log('🧹 Cleaning up stale test data...');

  // Get test user IDs first
  const testUsers = await prisma.user.findMany({
    where: { email: { contains: '@test.com' } },
    select: { id: true },
  });
  const testUserIds = testUsers.map(u => u.id);

  if (testUserIds.length > 0) {
    // Delete in proper order respecting foreign keys
    // 1. Order items (depends on orders)
    await prisma.orderItem.deleteMany({
      where: { order: { userId: { in: testUserIds } } },
    });

    // 2. Orders (depends on users)
    await prisma.order.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    // 3. Cart items (depends on carts)
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: { in: testUserIds } } },
    });

    // 4. Carts (depends on users)
    await prisma.cart.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    // 5. Addresses (depends on users)
    await prisma.address.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    // 6. Favorites (depends on users) - may not exist
    try {
      await (prisma as any).favorite.deleteMany({
        where: { userId: { in: testUserIds } },
      });
    } catch (e) {
      // Favorites table might not exist
    }

    // 7. Tokens (depends on users)
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    // 8. Finally delete users
    await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    });
  }

  // Clean up test categories
  await prisma.category.deleteMany({
    where: { slug: { startsWith: 'e2e-test-' } },
  });

  // Clean up test departments (model removed - skipped)

  // Clean up test landing pages
  await prisma.landingPage.deleteMany({
    where: { slug: { startsWith: 'e2e-test-' } },
  });

  // Clean up expired refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

setup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});

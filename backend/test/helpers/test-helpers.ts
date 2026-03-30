/**
 * Test Helper Library
 * Provides utilities for setting up and tearing down test data
 */

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

// ============================================================================
// Types
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  token: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface TestProduct {
  id: number;
  sku: string;
  name: string;
}

export interface TestCategory {
  id: number;
  name: string;
  slug: string;
}

export interface TestAddress {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
}

// ============================================================================
// App Setup
// ============================================================================

let app: INestApplication;
let prisma: PrismaService;

export async function setupTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  prisma = app.get<PrismaService>(PrismaService);
  await app.init();

  return { app, prisma };
}

export async function teardownTestApp(): Promise<void> {
  if (app) {
    await app.close();
  }
}

export function getApp(): INestApplication {
  return app;
}

export function getPrisma(): PrismaService {
  return prisma;
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Creates a test user and returns their JWT token
 */
export async function createTestUser(
  prismaClient: PrismaService,
  overrides: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  } = {},
): Promise<{ user: any; password: string }> {
  const email = overrides.email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
  const password = overrides.password || 'TestPassword123!';
  const firstName = overrides.firstName || 'Test';
  const lastName = overrides.lastName || 'User';
  const role = overrides.role || 'CUSTOMER';

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const user = await prismaClient.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      emailVerified: true, // Pre-verified for tests
      isActive: true,
    },
  });

  // Create cart for customer users
  if (role === 'CUSTOMER') {
    await prismaClient.cart.create({
      data: { userId: user.id },
    });
  }

  return { user, password };
}

/**
 * Logs in a user and returns their JWT token
 */
export async function loginUser(
  appInstance: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(appInstance.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.tokens?.accessToken || response.body.accessToken || response.body.access_token;
}

/**
 * Creates and logs in an admin user
 */
export async function loginAsAdmin(
  appInstance: INestApplication,
  prismaClient: PrismaService,
): Promise<TestUser> {
  const { user, password } = await createTestUser(prismaClient, {
    role: 'ADMIN',
    email: `admin-${Date.now()}@test.com`,
  });

  const token = await loginUser(appInstance, user.email, password);

  return {
    id: user.id,
    email: user.email,
    token,
    role: 'ADMIN',
  };
}

/**
 * Creates and logs in a customer user
 */
export async function loginAsCustomer(
  appInstance: INestApplication,
  prismaClient: PrismaService,
): Promise<TestUser> {
  const { user, password } = await createTestUser(prismaClient, {
    role: 'CUSTOMER',
    email: `customer-${Date.now()}@test.com`,
  });

  const token = await loginUser(appInstance, user.email, password);

  return {
    id: user.id,
    email: user.email,
    token,
    role: 'CUSTOMER',
  };
}

// ============================================================================
// Data Seeding Helpers
// ============================================================================

/**
 * Seeds test categories
 */
export async function seedCategories(
  prismaClient: PrismaService,
  count: number = 3,
): Promise<TestCategory[]> {
  const categories: TestCategory[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = Date.now();
    const category = await prismaClient.category.create({
      data: {
        name: `Test Category ${i + 1}`,
        slug: `test-category-${timestamp}-${i}`,
        sort_order: i,
        isActive: true,
      },
    });

    categories.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
  }

  return categories;
}

/**
 * Seeds test landing page with sections
 */
export async function seedLandingPage(
  prismaClient: PrismaService,
  slug: string = 'test-page',
): Promise<{ page: any; sections: any[] }> {
  const page = await prismaClient.landingPage.create({
    data: {
      title: 'Test Page',
      slug: `${slug}-${Date.now()}`,
      isActive: true,
      seoTitle: 'Test Page Title',
      seoDescription: 'Test page description',
    },
  });

  const sections = [];
  for (let i = 0; i < 3; i++) {
    const section = await prismaClient.landingSection.create({
      data: {
        landingPageId: page.id,
        type: 'RICH_TEXT',
        title: `Section ${i + 1}`,
        data: JSON.stringify({ content: `Content ${i + 1}` }),
        displayOrder: i,
        isActive: true,
      },
    });
    sections.push(section);
  }

  return { page, sections };
}

/**
 * Seeds test address for a user
 */
export async function seedAddress(
  prismaClient: PrismaService,
  userId: string,
  isDefault: boolean = false,
): Promise<TestAddress> {
  const address = await prismaClient.address.create({
    data: {
      userId,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+971501234567',
      addressLine1: '123 Test Street',
      addressLine2: 'Suite 100',
      city: 'Dubai',
      postalCode: '12345',
      isDefault,
    },
  });

  return {
    id: address.id,
    firstName: address.firstName,
    lastName: address.lastName,
    addressLine1: address.addressLine1,
    city: address.city,
  };
}

/**
 * Seeds a test favorite
 */
export async function seedFavorite(
  prismaClient: PrismaService,
  userId: string,
  productId: number,
): Promise<any> {
  return (prismaClient as any).favorite.create({
    data: {
      userId,
      productId,
    },
  });
}

/**
 * Seeds banners
 */
export async function seedBanners(
  prismaClient: PrismaService,
  count: number = 2,
): Promise<any[]> {
  const banners = [];

  for (let i = 0; i < count; i++) {
    const banner = await prismaClient.banner.create({
      data: {
        placement: 'HOME_HERO',
        title: `Test Banner ${i + 1}`,
        subtitle: `Subtitle ${i + 1}`,
        imageDesktopUrl: `https://example.com/banner-${i + 1}.jpg`,
        ctaText: 'Shop Now',
        ctaUrl: '/shop',
        isActive: true,
        displayOrder: i,
      },
    });
    banners.push(banner);
  }

  return banners;
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Cleans up test data for a specific user
 */
export async function cleanupUser(
  prismaClient: PrismaService,
  userId: string,
): Promise<void> {
  // Delete in order of dependencies
  await (prismaClient as any).favorite.deleteMany({ where: { userId } });
  await prismaClient.cartItem.deleteMany({
    where: { cart: { userId } },
  });
  await prismaClient.cart.deleteMany({ where: { userId } });
  await prismaClient.orderItem.deleteMany({
    where: { order: { userId } },
  });
  await prismaClient.order.deleteMany({ where: { userId } });
  await prismaClient.address.deleteMany({ where: { userId } });
  await prismaClient.emailVerificationToken.deleteMany({ where: { userId } });
  await prismaClient.passwordResetToken.deleteMany({ where: { userId } });
  await prismaClient.refreshToken.deleteMany({ where: { userId } });
  await prismaClient.user.delete({ where: { id: userId } });
}

/**
 * Cleans up test users by email pattern
 */
export async function cleanupTestUsers(
  prismaClient: PrismaService,
  emailPattern: string = '@test.com',
): Promise<void> {
  const users = await prismaClient.user.findMany({
    where: { email: { contains: emailPattern } },
    select: { id: true },
  });

  for (const user of users) {
    try {
      await cleanupUser(prismaClient, user.id);
    } catch (error) {
      // User might already be deleted
    }
  }
}

/**
 * Cleans up refresh tokens by user email pattern
 * Useful for preventing unique constraint violations during repeated logins
 */
export async function cleanupRefreshTokensByEmail(
  prismaClient: PrismaService,
  emailPattern: string = '@test.com',
): Promise<void> {
  try {
    const users = await prismaClient.user.findMany({
      where: { email: { contains: emailPattern } },
      select: { id: true },
    });

    for (const user of users) {
      await prismaClient.refreshToken.deleteMany({ where: { userId: user.id } });
    }
  } catch (error) {
    // Ignore errors - table might not exist or tokens already cleaned
  }
}

/**
 * Cleans up all refresh tokens for a specific user
 */
export async function cleanupUserRefreshTokens(
  prismaClient: PrismaService,
  userId: string,
): Promise<void> {
  try {
    await prismaClient.refreshToken.deleteMany({ where: { userId } });
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Cleans up test categories
 */
export async function cleanupTestCategories(
  prismaClient: PrismaService,
): Promise<void> {
  await prismaClient.category.deleteMany({
    where: { slug: { startsWith: 'test-category-' } },
  });
}

/**
 * Cleans up test landing pages
 */
export async function cleanupTestLandingPages(
  prismaClient: PrismaService,
): Promise<void> {
  const pages = await prismaClient.landingPage.findMany({
    where: { slug: { startsWith: 'test-page-' } },
  });

  for (const page of pages) {
    await prismaClient.landingSection.deleteMany({
      where: { landingPageId: page.id },
    });
    await prismaClient.landingPage.delete({ where: { id: page.id } });
  }
}

/**
 * Cleans up test banners
 */
export async function cleanupTestBanners(
  prismaClient: PrismaService,
): Promise<void> {
  await prismaClient.banner.deleteMany({
    where: { title: { startsWith: 'Test Banner' } },
  });
}

/**
 * Full test database cleanup
 */
export async function cleanupAllTestData(
  prismaClient: PrismaService,
): Promise<void> {
  await cleanupTestBanners(prismaClient);
  await cleanupTestLandingPages(prismaClient);
  await cleanupTestCategories(prismaClient);
  await cleanupTestUsers(prismaClient);
}

// ============================================================================
// Request Helpers
// ============================================================================

/**
 * Makes an authenticated GET request
 */
export function authGet(
  appInstance: INestApplication,
  path: string,
  token: string,
) {
  return request(appInstance.getHttpServer())
    .get(path)
    .set('Authorization', `Bearer ${token}`);
}

/**
 * Makes an authenticated POST request
 */
export function authPost(
  appInstance: INestApplication,
  path: string,
  token: string,
  body: any = {},
) {
  return request(appInstance.getHttpServer())
    .post(path)
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

/**
 * Makes an authenticated PATCH request
 */
export function authPatch(
  appInstance: INestApplication,
  path: string,
  token: string,
  body: any = {},
) {
  return request(appInstance.getHttpServer())
    .patch(path)
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

/**
 * Makes an authenticated DELETE request
 */
export function authDelete(
  appInstance: INestApplication,
  path: string,
  token: string,
) {
  return request(appInstance.getHttpServer())
    .delete(path)
    .set('Authorization', `Bearer ${token}`);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Validates paginated response structure
 */
export function expectPaginatedResponse(body: any) {
  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('meta');
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.meta).toHaveProperty('total');
  expect(body.meta).toHaveProperty('page');
  expect(body.meta).toHaveProperty('limit');
}

/**
 * Validates user object structure
 */
export function expectUserObject(user: any) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('firstName');
  expect(user).toHaveProperty('lastName');
  expect(user).toHaveProperty('role');
  // Should not expose password hash
  expect(user).not.toHaveProperty('passwordHash');
}

/**
 * Validates product object structure
 */
export function expectProductObject(product: any) {
  expect(product).toHaveProperty('id');
  expect(product).toHaveProperty('sku');
  expect(product).toHaveProperty('name');
}

/**
 * Validates order object structure
 */
export function expectOrderObject(order: any) {
  expect(order).toHaveProperty('id');
  expect(order).toHaveProperty('orderNumber');
  expect(order).toHaveProperty('status');
  expect(order).toHaveProperty('total');
}

/**
 * Validates address object structure
 */
export function expectAddressObject(address: any) {
  expect(address).toHaveProperty('id');
  expect(address).toHaveProperty('firstName');
  expect(address).toHaveProperty('lastName');
  expect(address).toHaveProperty('addressLine1');
  expect(address).toHaveProperty('city');
}

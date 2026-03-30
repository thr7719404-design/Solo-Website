/**
 * Favorites Module E2E Tests (GAP-006)
 * Tests favorites endpoints: GET, POST, toggle, check, DELETE
 * Based on GAP_FIX_VERIFICATION_GUIDE.md
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  setupTestApp,
  teardownTestApp,
  loginAsCustomer,
  loginAsAdmin,
  cleanupTestUsers,
  authGet,
  authPost,
  authDelete,
  TestUser,
} from '../helpers/test-helpers';

describe('Favorites Module (e2e) - GAP-006', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customer: TestUser;
  let customer2: TestUser;
  let testProductId: number;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    // Create test users
    customer = await loginAsCustomer(app, prisma);
    customer2 = await loginAsCustomer(app, prisma);

    // Get a real product ID from inventory (or use a known test product)
    const products = await prisma.$queryRaw<any[]>`
      SELECT id FROM inventory.products WHERE is_active = true LIMIT 1
    `.catch(() => []);
    
    testProductId = products[0]?.id || 1;
  });

  afterAll(async () => {
    // Cleanup favorites - wrap in try-catch in case table doesn't exist
    try {
      await (prisma as any).favorite.deleteMany({
        where: { userId: { in: [customer.id, customer2.id] } },
      });
    } catch (e) {
      console.log('Note: Favorites table may not exist yet. Run migrations.');
    }
    await cleanupTestUsers(prisma, '@test.com');
    await teardownTestApp();
  });

  afterEach(async () => {
    // Clean up favorites between tests - wrap in try-catch
    try {
      await (prisma as any).favorite.deleteMany({
        where: { userId: customer.id },
      });
    } catch (e) {
      // Table may not exist
    }
  });

  // ============================================================================
  // GET /favorites
  // ============================================================================
  describe('GET /favorites', () => {
    it('FAV-E01: should return empty list when no favorites (200)', async () => {
      const response = await authGet(app, '/favorites', customer.token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return list with favorited products', async () => {
      // Add a favorite directly
      await prisma.favorite.create({
        data: {
          userId: customer.id,
          productId: testProductId,
        },
      });

      const response = await authGet(app, '/favorites', customer.token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('FAV-E06: should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/favorites');

      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // POST /favorites/:productId
  // ============================================================================
  describe('POST /favorites/:productId', () => {
    it('FAV-E02: should add product to favorites (201)', async () => {
      // Clean up first
      await prisma.favorite.deleteMany({
        where: { userId: customer.id, productId: testProductId },
      }).catch(() => {});

      const response = await authPost(app, `/favorites/${testProductId}`, customer.token, {});

      expect([200, 201]).toContain(response.status);
      // productId might be returned as string or number
      expect(response.body).toHaveProperty('productId');
      expect(parseInt(String(response.body.productId), 10)).toBe(testProductId);

      // Verify in database
      const favorite = await prisma.favorite.findFirst({
        where: {
          userId: customer.id,
          productId: testProductId,
        },
      });
      expect(favorite).not.toBeNull();
    });

    it('should enforce unique userId + productId constraint', async () => {
      // Add first time (or already exists)
      await authPost(app, `/favorites/${testProductId}`, customer.token, {});

      // Try to add again
      const response = await authPost(app, `/favorites/${testProductId}`, customer.token, {});

      // Should either return conflict or the existing favorite
      expect([200, 201, 409]).toContain(response.status);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .post(`/favorites/${testProductId}`);

      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // POST /favorites/:productId/toggle
  // ============================================================================
  describe('POST /favorites/:productId/toggle', () => {
    it('FAV-E03: should add if not favorited (200)', async () => {
      // Ensure not favorited
      await prisma.favorite.deleteMany({
        where: { userId: customer.id, productId: testProductId },
      }).catch(() => {});

      const response = await authPost(app, `/favorites/${testProductId}/toggle`, customer.token, {});

      expect([200, 201]).toContain(response.status);
      
      // Verify added
      const favorite = await prisma.favorite.findFirst({
        where: { userId: customer.id, productId: testProductId },
      });
      expect(favorite).not.toBeNull();
    });

    it('should remove if already favorited', async () => {
      // Ensure favorited
      await prisma.favorite.upsert({
        where: {
          userId_productId: { userId: customer.id, productId: testProductId },
        },
        update: {},
        create: { userId: customer.id, productId: testProductId },
      });

      const response = await authPost(app, `/favorites/${testProductId}/toggle`, customer.token, {});

      expect([200, 201]).toContain(response.status);
      
      // Verify removed
      const favorite = await prisma.favorite.findFirst({
        where: { userId: customer.id, productId: testProductId },
      });
      expect(favorite).toBeNull();
    });
  });

  // ============================================================================
  // GET /favorites/:productId/check
  // ============================================================================
  describe('GET /favorites/:productId/check', () => {
    it('FAV-E04: should return isFavorite: true for favorited product', async () => {
      // Add favorite
      await prisma.favorite.upsert({
        where: {
          userId_productId: { userId: customer.id, productId: testProductId },
        },
        update: {},
        create: { userId: customer.id, productId: testProductId },
      });

      const response = await authGet(
        app, 
        `/favorites/${testProductId}/check`, 
        customer.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isFavorite', true);
    });

    it('should return isFavorite: false for non-favorited product', async () => {
      // Ensure not favorited
      await prisma.favorite.deleteMany({
        where: { userId: customer.id, productId: testProductId },
      }).catch(() => {});

      const response = await authGet(
        app, 
        `/favorites/${testProductId}/check`, 
        customer.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isFavorite', false);
    });
  });

  // ============================================================================
  // DELETE /favorites/:productId
  // ============================================================================
  describe('DELETE /favorites/:productId', () => {
    it('FAV-E05: should remove favorite (200)', async () => {
      // Add favorite first
      await prisma.favorite.upsert({
        where: {
          userId_productId: { userId: customer.id, productId: testProductId },
        },
        update: {},
        create: { userId: customer.id, productId: testProductId },
      });

      const response = await authDelete(
        app, 
        `/favorites/${testProductId}`, 
        customer.token
      );

      expect(response.status).toBe(200);

      // Verify removed
      const favorite = await prisma.favorite.findFirst({
        where: { userId: customer.id, productId: testProductId },
      });
      expect(favorite).toBeNull();
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/favorites/${testProductId}`);

      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // Ownership / Isolation Tests
  // ============================================================================
  describe('Ownership isolation', () => {
    it('should not show other user favorites', async () => {
      // Customer 1 adds favorite
      await prisma.favorite.upsert({
        where: {
          userId_productId: { userId: customer.id, productId: testProductId },
        },
        update: {},
        create: { userId: customer.id, productId: testProductId },
      });

      // Customer 2 should not see customer 1's favorites
      const response = await authGet(app, '/favorites', customer2.token);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Security Test: Admin Guards
 *
 * Verifies that ALL admin/CMS endpoints reject unauthenticated and
 * non-admin (CUSTOMER) requests with 401/403.
 */
describe('Admin Guards Security (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    const hashedPassword = await argon2.hash('TestPass123!', {
      type: argon2.argon2id,
    });

    // Seed CUSTOMER
    await prisma.user.upsert({
      where: { email: 'guard-test-customer@test.com' },
      update: {},
      create: {
        email: 'guard-test-customer@test.com',
        passwordHash: hashedPassword,
        firstName: 'Guard',
        lastName: 'Customer',
        role: 'CUSTOMER',
      },
    });

    // Seed ADMIN
    await prisma.user.upsert({
      where: { email: 'guard-test-admin@test.com' },
      update: {},
      create: {
        email: 'guard-test-admin@test.com',
        passwordHash: hashedPassword,
        firstName: 'Guard',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    // Obtain tokens
    const custLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'guard-test-customer@test.com', password: 'TestPass123!' });
    customerToken =
      custLogin.body.tokens?.accessToken || custLogin.body.access_token;

    const admLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'guard-test-admin@test.com', password: 'TestPass123!' });
    adminToken =
      admLogin.body.tokens?.accessToken || admLogin.body.access_token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ['guard-test-customer@test.com', 'guard-test-admin@test.com'] },
      },
    });
    await app.close();
  });

  // =========================================================================
  // CMS Admin Endpoints
  // =========================================================================
  const cmsAdminRoutes: { method: 'get' | 'post' | 'patch' | 'delete'; path: string }[] = [
    { method: 'get', path: '/cms/admin/home' },
    { method: 'post', path: '/cms/admin/home/sections' },
    { method: 'patch', path: '/cms/admin/home/sections/fake-id' },
    { method: 'delete', path: '/cms/admin/home/sections/fake-id' },
    { method: 'post', path: '/cms/admin/home/sections/reorder' },
    { method: 'get', path: '/cms/admin/category-landings' },
    { method: 'get', path: '/cms/admin/category-landings/fake-id' },
    { method: 'post', path: '/cms/admin/category-landings' },
    { method: 'patch', path: '/cms/admin/category-landings/fake-id' },
    { method: 'delete', path: '/cms/admin/category-landings/fake-id' },
    { method: 'post', path: '/cms/admin/category-landings/fake-id/sections' },
    { method: 'patch', path: '/cms/admin/category-sections/fake-id' },
    { method: 'delete', path: '/cms/admin/category-sections/fake-id' },
    { method: 'post', path: '/cms/admin/category-landings/fake-id/sections/reorder' },
  ];

  describe('CMS admin routes', () => {
    it.each(cmsAdminRoutes)(
      '$method $path → 401 without token',
      async ({ method, path }) => {
        const res = await (request(app.getHttpServer()) as any)[method](path).send({});
        expect(res.status).toBe(401);
      },
    );

    it.each(cmsAdminRoutes)(
      '$method $path → 403 with CUSTOMER token',
      async ({ method, path }) => {
        const res = await (request(app.getHttpServer()) as any)[method](path)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({});
        expect(res.status).toBe(403);
      },
    );

    it('GET /cms/admin/home → 200 with ADMIN token', async () => {
      const res = await request(app.getHttpServer())
        .get('/cms/admin/home')
        .set('Authorization', `Bearer ${adminToken}`);
      // Should succeed (200) or return data, not 401/403
      expect([200, 201]).toContain(res.status);
    });
  });

  // =========================================================================
  // Admin Controller Endpoints (class-level guard)
  // =========================================================================
  const adminRoutes: { method: 'get' | 'patch'; path: string }[] = [
    { method: 'get', path: '/admin/stats' },
    { method: 'get', path: '/admin/orders' },
    { method: 'get', path: '/admin/orders/fake-id' },
    { method: 'patch', path: '/admin/orders/fake-id/status' },
  ];

  describe('Admin controller routes', () => {
    it.each(adminRoutes)(
      '$method $path → 401 without token',
      async ({ method, path }) => {
        const res = await (request(app.getHttpServer()) as any)[method](path).send({});
        expect(res.status).toBe(401);
      },
    );

    it.each(adminRoutes)(
      '$method $path → 403 with CUSTOMER token',
      async ({ method, path }) => {
        const res = await (request(app.getHttpServer()) as any)[method](path)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({});
        expect(res.status).toBe(403);
      },
    );

    it('GET /admin/stats → 200 with ADMIN token', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 201]).toContain(res.status);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Admin CRUD Authorization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let testCategoryId: number | null;
  let testBrandId: number | null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create test users
    const hashedPassword = await argon2.hash('password123', {
      type: argon2.argon2id,
    });

    // Create CUSTOMER user
    await prisma.user.upsert({
      where: { email: 'customer-crud@test.com' },
      update: {},
      create: {
        email: 'customer-crud@test.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Customer',
        role: 'CUSTOMER',
      },
    });

    // Create ADMIN user
    await prisma.user.upsert({
      where: { email: 'admin-crud@test.com' },
      update: {},
      create: {
        email: 'admin-crud@test.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    // Get JWT tokens
    const customerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'customer-crud@test.com',
        password: 'password123',
      });
    customerToken = customerLogin.body.tokens?.accessToken || customerLogin.body.access_token;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-crud@test.com',
        password: 'password123',
      });
    adminToken = adminLogin.body.tokens?.accessToken || adminLogin.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testCategoryId) {
      await prisma.category.deleteMany({
        where: { id: testCategoryId },
      });
    }
    if (testBrandId) {
      await prisma.brand.deleteMany({
        where: { id: testBrandId },
      });
    }
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['customer-crud@test.com', 'admin-crud@test.com'],
        },
      },
    });
    await app.close();
  });

  describe('Categories CRUD', () => {
    describe('POST /categories', () => {
      it('should return 403 when CUSTOMER attempts to create category', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            name: 'Unauthorized Category',
            slug: 'unauth-cat-' + Date.now(),
          });

        expect(response.status).toBe(403);
      });

      it('should return 201 when ADMIN successfully creates category', async () => {
        const slug = 'test-cat-create-' + Date.now();
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Admin Created Category',
            slug: slug,
            description: 'Created by admin',
            sort_order: 100,
            isActive: true,
          });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Admin Created Category');
        testCategoryId = response.body.id;
      });

      it('should return 401 when no authentication token is provided', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .send({
            name: 'Unauthenticated Category',
            slug: 'unauth-cat',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('PATCH /categories/:id', () => {
      it('should return 403 when CUSTOMER attempts to update category', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            name: 'Updated by Customer',
          });

        expect(response.status).toBe(403);
      });

      it('should return 200 when ADMIN successfully updates category', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Updated by admin',
          });

        expect(response.status).toBe(200);
        expect(response.body.description).toBe('Updated by admin');
      });
    });

    describe('DELETE /categories/:id', () => {
      it('should return 403 when CUSTOMER attempts to delete category', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${customerToken}`);

        expect(response.status).toBe(403);
      });

      it('should return 200 when ADMIN successfully deletes category', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/categories/${testCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deleted successfully');
        testCategoryId = null;
      });
    });
  });

  describe('Brands CRUD', () => {
    describe('POST /brands', () => {
      it('should return 403 when CUSTOMER attempts to create brand', async () => {
        const response = await request(app.getHttpServer())
          .post('/brands')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            name: 'Unauthorized Brand',
            slug: 'unauth-brand-' + Date.now(),
          });

        expect(response.status).toBe(403);
      });

      it('should return 201 when ADMIN successfully creates brand', async () => {
        const slug = 'test-brand-create-' + Date.now();
        const response = await request(app.getHttpServer())
          .post('/brands')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Admin Created Brand',
            slug: slug,
            description: 'Created by admin',
            isActive: true,
          });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Admin Created Brand');
        testBrandId = response.body.id;
      });

      it('should return 401 when no authentication token is provided', async () => {
        const response = await request(app.getHttpServer())
          .post('/brands')
          .send({
            name: 'Unauthenticated Brand',
            slug: 'unauth-brand',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('PATCH /brands/:id', () => {
      it('should return 403 when CUSTOMER attempts to update brand', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/brands/${testBrandId}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            name: 'Updated by Customer',
          });

        expect(response.status).toBe(403);
      });

      it('should return 200 when ADMIN successfully updates brand', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/brands/${testBrandId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Updated by admin',
          });

        expect(response.status).toBe(200);
        expect(response.body.description).toBe('Updated by admin');
      });
    });

    describe('DELETE /brands/:id', () => {
      it('should return 403 when CUSTOMER attempts to delete brand', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/brands/${testBrandId}`)
          .set('Authorization', `Bearer ${customerToken}`);

        expect(response.status).toBe(403);
      });

      it('should return 200 when ADMIN successfully deletes brand', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/brands/${testBrandId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('deleted successfully');
        testBrandId = null;
      });
    });
  });

  describe('Public GET endpoints', () => {
    it('GET /categories should return 200 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer()).get('/categories');
      expect(response.status).toBe(200);
    });

    it('GET /brands should return 200 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer()).get('/brands');
      expect(response.status).toBe(200);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products Admin Authorization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let testProductId: number;
  let testCategoryId: number;
  let testBrandId: number;
  const timestamp = Date.now();

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
      where: { email: 'customer@test.com' },
      update: {},
      create: {
        email: 'customer@test.com',
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Customer',
        role: 'CUSTOMER',
      },
    });

    // Create ADMIN user
    await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
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
        email: 'customer@test.com',
        password: 'password123',
      });
    customerToken = customerLogin.body.tokens?.accessToken || customerLogin.body.access_token;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123',
      });
    adminToken = adminLogin.body.tokens?.accessToken || adminLogin.body.access_token;

    // Create test category and brand for product creation
    const testCategory = await prisma.category.create({
      data: {
        name: `Test Category ${timestamp}`,
        slug: `test-category-${timestamp}`,
        description: `Test Category EN ${timestamp}`,
      },
    });
    testCategoryId = testCategory.id;

    const testBrand = await prisma.brand.create({
      data: {
        name: `Test Brand ${timestamp}`,
        slug: `test-brand-${timestamp}`,
        description: `Test Brand EN ${timestamp}`,
      },
    });
    testBrandId = testBrand.id;

    // Create a test product for update/delete tests
    const testProduct = await prisma.product.create({
      data: {
        sku: `test-product-${timestamp}`,
        productName: 'Test Product for E2E',
        slug: `test-product-${timestamp}`,
        description: 'Test product description',
        categoryId: testCategoryId,
        brandId: testBrandId,
      },
    });
    testProductId = testProduct.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.productPricing.deleteMany({
      where: {
        product: {
          sku: { startsWith: 'test-' },
        },
      },
    });
    await prisma.product.deleteMany({
      where: {
        sku: { startsWith: 'test-' },
      },
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId },
    });
    await prisma.brand.deleteMany({
      where: { id: testBrandId },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['customer@test.com', 'admin@test.com'],
        },
      },
    });
    await app.close();
  });

  describe('POST /products', () => {
    it('should return 403 when CUSTOMER attempts to create product', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          sku: `test-create-unauth-${timestamp}`,
          name: 'Unauthorized Product',
          slug: `unauthorized-product-${timestamp}`,
          description: 'A test product',
          categoryId: testCategoryId.toString(),
          brandId: testBrandId.toString(),
          price: 99.99,
          stock: 10,
        });

      expect(response.status).toBe(403);
    });

    it('should return 201 when ADMIN successfully creates product', async () => {
      const uniqueSku = `test-admin-create-${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: uniqueSku,
          name: 'Admin Product',
          slug: `admin-product-${Date.now()}`,
          description: 'Admin created product',
          categoryId: testCategoryId.toString(),
          brandId: testBrandId.toString(),
          price: 149.99,
          stock: 5,
          isFeatured: true,
        });

      if (response.status !== 201) {
        console.log('Create product error:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      // Response comes from findOne which merges product data
      expect(response.body.sku).toBe(uniqueSku);

      // Clean up
      if (response.body.id) {
        await prisma.product.delete({
          where: { id: parseInt(response.body.id) },
        });
      }
    });

    it('should return 401 when no authentication token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({
          sku: `test-noauth-${timestamp}`,
          name: 'Unauthenticated Product',
          slug: `unauth-product-${timestamp}`,
          description: 'Should fail',
          categoryId: testCategoryId.toString(),
          brandId: testBrandId.toString(),
          price: 49.99,
          stock: 1,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should return 403 when CUSTOMER attempts to update product', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Customer trying to update',
        });

      expect(response.status).toBe(403);
    });

    it('should return 200 when ADMIN successfully updates product', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated by admin',
          isFeatured: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('Updated by admin');
    });

    it('should return 401 when no authentication token is provided', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/products/${testProductId}`)
        .send({
          description: 'No auth update',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /products/:id', () => {
    let deleteTestProductId: number;

    beforeEach(async () => {
      // Create a product to delete in each test
      const product = await prisma.product.create({
        data: {
          sku: 'test-product-delete-' + Date.now(),
          productName: 'Product to Delete',
          slug: 'test-product-delete-' + Date.now(),
          description: 'This product will be deleted',
          categoryId: testCategoryId,
          brandId: testBrandId,
        },
      });
      deleteTestProductId = product.id;
    });

    afterEach(async () => {
      // Cleanup any remaining test products
      await prisma.product.deleteMany({
        where: {
          sku: { startsWith: 'test-product-delete-' },
        },
      });
    });

    it('should return 403 when CUSTOMER attempts to delete product', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${deleteTestProductId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);

      // Verify product still exists
      const product = await prisma.product.findUnique({
        where: { id: deleteTestProductId },
      });
      expect(product).not.toBeNull();
    });

    it('should return 200 when ADMIN successfully deletes product', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${deleteTestProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Verify product was deleted
      const product = await prisma.product.findUnique({
        where: { id: deleteTestProductId },
      });
      expect(product).toBeNull();
    });

    it('should return 401 when no authentication token is provided', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/products/${deleteTestProductId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /products (public access)', () => {
    it('should return 200 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/products');

      expect(response.status).toBe(200);
    });

    it('should return 200 for CUSTOMER requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 200 for ADMIN requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});

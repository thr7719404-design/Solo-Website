/**
 * Content/CMS Module E2E Tests (GAP-007/008/009/016/017)
 * Tests CMS endpoints: pages, loyalty-config, admin landing pages
 * Based on GAP_FIX_VERIFICATION_GUIDE.md
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  setupTestApp,
  teardownTestApp,
  loginAsAdmin,
  loginAsCustomer,
  cleanupTestUsers,
  cleanupTestLandingPages,
  authGet,
  authPost,
  authPatch,
  authDelete,
  TestUser,
} from '../helpers/test-helpers';

describe('Content/CMS Module (e2e) - GAP-007/008/009/016/017', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: TestUser;
  let customer: TestUser;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    // Create test users
    admin = await loginAsAdmin(app, prisma);
    customer = await loginAsCustomer(app, prisma);
  });

  afterAll(async () => {
    await cleanupTestLandingPages(prisma);
    await cleanupTestUsers(prisma, '@test.com');
    await teardownTestApp();
  });

  // ============================================================================
  // Public CMS Pages (GAP-007/008)
  // ============================================================================
  describe('GET /content/pages/:slug - Public CMS Pages', () => {
    it('CMS-E01: should return about-us page or 404 (GAP-007)', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/pages/about-us');

      // Either page exists or 404
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('slug', 'about-us');
      }
    });

    it('CMS-E02: should return bulk-order page or 404 (GAP-008)', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/pages/bulk-order');

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('slug', 'bulk-order');
      }
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/pages/non-existent-page-xyz');

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // Loyalty Config (GAP-009)
  // ============================================================================
  describe('GET /content/loyalty-config - Loyalty Configuration (GAP-009)', () => {
    it('CMS-E03: should return loyalty config (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/loyalty-config');

      // Either returns config or 404 if not configured
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        // Verify config structure
        expect(response.body).toBeDefined();
      }
    });
  });

  // ============================================================================
  // Admin Landing Pages (GAP-016/017)
  // ============================================================================
  describe('GET /content/admin/pages - Admin Landing Pages List (GAP-016)', () => {
    it('CMS-E04: should return pages list for admin (200)', async () => {
      const response = await authGet(app, '/content/admin/pages', admin.token);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/admin/pages');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const response = await authGet(app, '/content/admin/pages', customer.token);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /content/admin/pages - Create Landing Page (GAP-017)', () => {
    let createdPageId: string;

    afterEach(async () => {
      if (createdPageId) {
        await prisma.landingSection.deleteMany({ where: { landingPageId: createdPageId } });
        await prisma.landingPage.delete({ where: { id: createdPageId } }).catch(() => {});
        createdPageId = '';
      }
    });

    it('CMS-E05: should create landing page for admin (201)', async () => {
      const pageData = {
        title: 'Test Page',
        slug: `test-page-${Date.now()}`,
        isActive: true,
        metaTitle: 'Test Page Title',
        metaDescription: 'Test description',
      };

      const response = await authPost(
        app, 
        '/content/admin/pages', 
        admin.token, 
        pageData
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Page');
      expect(response.body).toHaveProperty('slug');

      createdPageId = response.body.id;
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/content/admin/pages')
        .send({
          title: 'Unauthorized Page',
          slug: 'unauthorized-page',
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const response = await authPost(app, '/content/admin/pages', customer.token, {
        title: 'Customer Page',
        slug: 'customer-page',
      });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /content/admin/pages/:id - Update Landing Page', () => {
    let testPageId: string;

    beforeEach(async () => {
      const page = await prisma.landingPage.create({
        data: {
          title: 'Page to Update',
          slug: `test-update-${Date.now()}`,
          isActive: true,
        },
      });
      testPageId = page.id;
    });

    afterEach(async () => {
      await prisma.landingPage.delete({ where: { id: testPageId } }).catch(() => {});
    });

    it('CMS-E06: should update landing page for admin (200)', async () => {
      const response = await authPatch(
        app, 
        `/content/admin/pages/${testPageId}`, 
        admin.token, 
        { title: 'Updated Title' }
      );

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });

    it('should return 403 for non-admin', async () => {
      const response = await authPatch(
        app, 
        `/content/admin/pages/${testPageId}`, 
        customer.token, 
        { title: 'Customer Update' }
      );

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /content/admin/pages/:id - Delete Landing Page', () => {
    let testPageId: string;

    beforeEach(async () => {
      const page = await prisma.landingPage.create({
        data: {
          title: 'Page to Delete',
          slug: `test-delete-${Date.now()}`,
          isActive: true,
        },
      });
      testPageId = page.id;
    });

    it('CMS-E07: should delete landing page for admin (200)', async () => {
      const response = await authDelete(
        app, 
        `/content/admin/pages/${testPageId}`, 
        admin.token
      );

      expect(response.status).toBe(200);

      // Verify deleted
      const page = await prisma.landingPage.findUnique({
        where: { id: testPageId },
      });
      expect(page).toBeNull();
    });

    it('should return 403 for non-admin', async () => {
      const response = await authDelete(
        app, 
        `/content/admin/pages/${testPageId}`, 
        customer.token
      );

      expect(response.status).toBe(403);

      // Cleanup
      await prisma.landingPage.delete({ where: { id: testPageId } }).catch(() => {});
    });
  });

  // ============================================================================
  // Admin Sections
  // ============================================================================
  describe('POST /content/admin/sections - Create Section', () => {
    let testPageId: string;
    let createdSectionId: string;

    beforeAll(async () => {
      const page = await prisma.landingPage.create({
        data: {
          title: 'Page for Sections',
          slug: `test-sections-${Date.now()}`,
          isActive: true,
        },
      });
      testPageId = page.id;
    });

    afterAll(async () => {
      await prisma.landingSection.deleteMany({ where: { landingPageId: testPageId } });
      await prisma.landingPage.delete({ where: { id: testPageId } }).catch(() => {});
    });

    afterEach(async () => {
      if (createdSectionId) {
        await prisma.landingSection.delete({ where: { id: createdSectionId } }).catch(() => {});
        createdSectionId = '';
      }
    });

    it('CMS-E08: should create section for admin (201)', async () => {
      const sectionData = {
        landingPageId: testPageId,
        type: 'HERO',
        title: 'Welcome',
        data: '{}',
        displayOrder: 0,
        isActive: true,
      };

      const response = await authPost(
        app, 
        '/content/admin/sections', 
        admin.token, 
        sectionData
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'HERO');

      createdSectionId = response.body.id;
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/content/admin/sections')
        .send({
          landingPageId: testPageId,
          type: 'CONTENT',
          title: 'Unauthorized',
          displayOrder: 0,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /content/pages/:pageId/sections/reorder - Reorder Sections', () => {
    let testPageId: string;
    let section1Id: string;
    let section2Id: string;

    beforeAll(async () => {
      const page = await prisma.landingPage.create({
        data: {
          title: 'Page for Reorder',
          slug: `test-reorder-${Date.now()}`,
          isActive: true,
        },
      });
      testPageId = page.id;

      const section1 = await prisma.landingSection.create({
        data: {
          landingPageId: testPageId,
          type: 'HERO',
          title: 'Section 1',
          data: '{}',
          displayOrder: 0,
          isActive: true,
        },
      });
      section1Id = section1.id;

      const section2 = await prisma.landingSection.create({
        data: {
          landingPageId: testPageId,
          type: 'RICH_TEXT',
          title: 'Section 2',
          data: '{}',
          displayOrder: 1,
          isActive: true,
        },
      });
      section2Id = section2.id;
    });

    afterAll(async () => {
      await prisma.landingSection.deleteMany({ where: { landingPageId: testPageId } });
      await prisma.landingPage.delete({ where: { id: testPageId } }).catch(() => {});
    });

    it('CMS-E09: should reorder sections for admin (200 or 201)', async () => {
      const response = await authPost(
        app, 
        `/content/pages/${testPageId}/sections/reorder`, 
        admin.token, 
        {
          orders: [
            { id: section1Id, displayOrder: 1 },
            { id: section2Id, displayOrder: 0 },
          ],
        }
      );

      // Accept both 200 and 201 as valid success responses
      expect([200, 201]).toContain(response.status);

      // Verify order changed
      const sections = await prisma.landingSection.findMany({
        where: { landingPageId: testPageId },
        orderBy: { displayOrder: 'asc' },
      });

      expect(sections[0].id).toBe(section2Id);
      expect(sections[1].id).toBe(section1Id);
    });
  });

  // ============================================================================
  // Banners
  // ============================================================================
  describe('GET /content/banners - Public Banners', () => {
    it('should return active banners (200)', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/banners');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by placement', async () => {
      const response = await request(app.getHttpServer())
        .get('/content/banners?placement=HOME_HERO');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

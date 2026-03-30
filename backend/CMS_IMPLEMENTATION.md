# CMS Implementation Summary

## Overview
Implemented a comprehensive Content Management System (CMS) for the Solo Ecommerce platform with Banner, LandingPage, and LandingSection models.

## Database Models

### 1. Banner Model
**Purpose**: Display promotional banners across different site locations with date-window awareness.

**Fields**:
- `id` (UUID, Primary Key)
- `placement` (Enum: HOME_HERO, HOME_MID, CATEGORY_TOP, CATEGORY_MID, PRODUCT_SIDEBAR, CHECKOUT_TOP, HOME_SECONDARY, CATEGORY, PROMOTION)
- `title` (String, Required)
- `subtitle` (String, Optional)
- `ctaText` (String, Optional) - Call-to-action text
- `ctaUrl` (String, Optional) - Call-to-action URL
- `imageDesktopUrl` (String, Required, Default: "")
- `imageMobileUrl` (String, Optional)
- `startAt` (DateTime, Optional) - Banner activation date
- `endAt` (DateTime, Optional) - Banner expiration date
- `displayOrder` (Int, Default: 0)
- `isActive` (Boolean, Default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes**: placement, isActive, displayOrder, startAt, endAt

**Relations**: One banner can be used as heroBanner for multiple LandingPages

---

### 2. LandingPage Model
**Purpose**: Create custom landing pages with SEO support and dynamic sections.

**Fields**:
- `id` (UUID, Primary Key)
- `slug` (String, Unique, Required) - URL-friendly identifier
- `title` (String, Required)
- `heroBannerId` (UUID, Optional) - Reference to Banner
- `seoTitle` (String, Optional)
- `seoDescription` (Text, Optional)
- `isActive` (Boolean, Default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes**: slug, isActive

**Relations**:
- `heroBanner`: Optional Banner relation (onDelete: SetNull)
- `sections`: One-to-many LandingSection (cascade delete)

---

### 3. LandingSection Model
**Purpose**: Modular content sections for landing pages with flexible JSON data.

**Fields**:
- `id` (UUID, Primary Key)
- `landingPageId` (UUID, Required) - Reference to LandingPage
- `type` (Enum: PRODUCT_GRID, CATEGORY_GRID, RICH_TEXT, IMAGE, BANNER_CAROUSEL)
- `data` (Text/JSON, Required) - Flexible JSON data for section content
- `displayOrder` (Int, Default: 0)
- `isActive` (Boolean, Default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes**: landingPageId, displayOrder, isActive

**Relations**: Belongs to LandingPage (cascade delete)

---

## API Endpoints

### Public Endpoints

#### GET /api/content/banners
**Description**: Fetch active banners filtered by placement and date window.

**Query Parameters**:
- `placement` (optional): BannerPlacement enum value

**Response**: Array of active banners matching criteria
- Filters: `isActive = true`, current date within `startAt`/`endAt` window
- Sorting: `displayOrder ASC`

**Example**:
```bash
GET /api/content/banners?placement=HOME_HERO
```

---

#### GET /api/content/pages/:slug
**Description**: Fetch landing page by slug with hero banner and active sections.

**Parameters**:
- `slug` (required): URL-friendly page identifier

**Response**: Landing page object with:
- Hero banner details (if set)
- Active sections ordered by displayOrder

**Example**:
```bash
GET /api/content/pages/holiday-sale
```

---

### Admin Endpoints (Requires ADMIN or SUPER_ADMIN role)

#### Banner Management

##### GET /api/content/admin/banners
**Description**: List all banners (admin view).

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Array of all banners ordered by displayOrder

---

##### GET /api/content/admin/banners/:id
**Description**: Get single banner by ID.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Banner object or 404

---

##### POST /api/content/admin/banners
**Description**: Create new banner.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Request Body**:
```json
{
  "placement": "HOME_HERO",
  "title": "Summer Sale",
  "subtitle": "Up to 50% off",
  "ctaText": "Shop Now",
  "ctaUrl": "/products/sale",
  "imageDesktopUrl": "https://cdn.example.com/summer-sale.jpg",
  "imageMobileUrl": "https://cdn.example.com/summer-sale-mobile.jpg",
  "startAt": "2025-06-01T00:00:00Z",
  "endAt": "2025-08-31T23:59:59Z",
  "displayOrder": 1,
  "isActive": true
}
```

**Validation**:
- `placement`: Optional BannerPlacement enum
- `title`: Required string
- `subtitle`: Optional string
- `ctaText`: Optional string
- `ctaUrl`: Optional valid URL
- `imageDesktopUrl`: Required valid URL
- `imageMobileUrl`: Optional valid URL
- `startAt`: Optional ISO date string
- `endAt`: Optional ISO date string
- `displayOrder`: Optional integer
- `isActive`: Optional boolean

**Response**: Created banner object

---

##### PATCH /api/content/admin/banners/:id
**Description**: Update existing banner.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Request Body**: Same as POST (all fields optional)

**Response**: Updated banner object or 404

---

##### DELETE /api/content/admin/banners/:id
**Description**: Delete banner.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Deleted banner object or 404

---

#### Landing Page Management

##### GET /api/content/admin/pages
**Description**: List all landing pages with hero banners and section counts.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Array of landing pages with relations

---

##### GET /api/content/admin/pages/:id
**Description**: Get single landing page by ID with all sections.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Landing page object with hero banner and sections or 404

---

##### POST /api/content/admin/pages
**Description**: Create new landing page.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Request Body**:
```json
{
  "slug": "holiday-sale",
  "title": "Holiday Sale 2025",
  "heroBannerId": "uuid-of-banner",
  "seoTitle": "Holiday Sale - Up to 60% Off | Solo Ecommerce",
  "seoDescription": "Amazing holiday deals on electronics, fashion, and more.",
  "isActive": true
}
```

**Validation**:
- `slug`: Required string (must be unique)
- `title`: Required string
- `heroBannerId`: Optional valid UUID (must reference existing banner)
- `seoTitle`: Optional string
- `seoDescription`: Optional string
- `isActive`: Optional boolean

**Business Rules**:
- Slug must be unique (409 if exists)
- Hero banner must exist if provided (404 if not found)

**Response**: Created landing page object

---

##### PATCH /api/content/admin/pages/:id
**Description**: Update existing landing page.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Request Body**: Same as POST (all fields optional)

**Business Rules**:
- Slug must be unique among other pages (409 if exists)
- Hero banner must exist if provided (404 if not found)

**Response**: Updated landing page object or 404

---

##### DELETE /api/content/admin/pages/:id
**Description**: Delete landing page (cascade deletes all sections).

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Deleted landing page object or 404

---

#### Landing Section Management

##### GET /api/content/admin/sections
**Description**: List all landing sections with page relations.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Array of sections ordered by displayOrder

---

##### GET /api/content/admin/sections/:id
**Description**: Get single section by ID.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Section object with landing page relation or 404

---

##### POST /api/content/admin/sections
**Description**: Create new landing section.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Request Body**:
```json
{
  "landingPageId": "uuid-of-page",
  "type": "PRODUCT_GRID",
  "data": "{\"productIds\": [\"uuid1\", \"uuid2\"], \"columns\": 4}",
  "displayOrder": 1,
  "isActive": true
}
```

**Validation**:
- `landingPageId`: Required valid UUID (must reference existing page)
- `type`: Required LandingSectionType enum
- `data`: Required string (must be valid JSON)
- `displayOrder`: Optional integer
- `isActive`: Optional boolean

**Business Rules**:
- Landing page must exist (404 if not found)
- Data must be valid JSON (409 if invalid)

**Response**: Created section object

---

##### PATCH /api/content/admin/sections/:id
**Description**: Update existing section.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Request Body**: Same as POST (all fields optional)

**Business Rules**:
- Landing page must exist if changed (404 if not found)
- Data must be valid JSON if provided (409 if invalid)

**Response**: Updated section object or 404

---

##### DELETE /api/content/admin/sections/:id
**Description**: Delete landing section.

**Authorization**: JWT + RolesGuard (ADMIN, SUPER_ADMIN)

**Response**: Deleted section object or 404

---

## Implementation Details

### Migration
**File**: `prisma/migrations/20251227215658_update_cms_models/migration.sql`

**Changes**:
- Updated Banner model: Added `placement`, `ctaText`, `ctaUrl`, `imageDesktopUrl`, `imageMobileUrl`, `startAt`, `endAt`, `displayOrder`
- Removed old fields: `type`, `image`, `mobileImage`, `linkUrl`, `linkText`, `sortOrder`, `startsAt`, `endsAt`
- Created LandingPage table with SEO fields and heroBannerId relation
- Created LandingSection table with JSON data field and cascade delete
- Added indexes for performance

---

### Service Layer
**File**: `backend/src/content/content.service.ts`

**Features**:
- **Date-aware banner filtering**: Automatically filters banners based on `startAt`/`endAt` and current date
- **Slug uniqueness validation**: Prevents duplicate landing page slugs
- **Referential integrity checks**: Validates banner and page references before creation/update
- **JSON validation**: Ensures section data is valid JSON before saving
- **Cascade deletion**: Landing page deletion automatically removes associated sections

**Key Methods**:
- `getActiveBanners(placement?)`: Public method for frontend - filters by active, date window, and placement
- `getLandingPageBySlug(slug)`: Public method for frontend - returns page with hero banner and active sections
- Full CRUD for all three models with admin authorization

---

### Controller Layer
**File**: `backend/src/content/content.controller.ts`

**Authorization**:
- Public endpoints: No authentication required
- Admin endpoints: Protected by `JwtAuthGuard` + `RolesGuard` requiring ADMIN or SUPER_ADMIN role

**Routing Structure**:
- `/api/content/banners` - Public banner list
- `/api/content/pages/:slug` - Public page view
- `/api/content/admin/banners/*` - Admin banner CRUD
- `/api/content/admin/pages/*` - Admin page CRUD
- `/api/content/admin/sections/*` - Admin section CRUD

---

### DTOs (Data Transfer Objects)
**Location**: `backend/src/content/dto/`

**Files**:
1. `create-banner.dto.ts` + `update-banner.dto.ts`
   - Enum: BannerPlacement (9 values)
   - Validation: URL validation for images and CTA, date string validation

2. `create-landing-page.dto.ts` + `update-landing-page.dto.ts`
   - Validation: Slug required, UUID validation for banner

3. `create-landing-section.dto.ts` + `update-landing-section.dto.ts`
   - Enum: LandingSectionType (5 values)
   - Validation: UUID for page, JSON string for data

**Validation Rules**:
- Uses `class-validator` decorators
- URL validation with `@IsUrl()`
- Date validation with `@IsDateString()`
- Enum validation with `@IsEnum()`
- UUID validation with `@IsUUID()`

---

### Module Configuration
**File**: `backend/src/content/content.module.ts`

**Imports**: PrismaModule (for database access)

**Providers**: ContentService

**Controllers**: ContentController

**Exports**: ContentService (available for other modules)

---

## Testing

### Manual Testing Examples

#### 1. Test Public Banner Endpoint
```bash
curl http://localhost:3000/api/content/banners?placement=HOME_HERO
```

**Expected**: Returns active banners for HOME_HERO placement within date window

---

#### 2. Test Public Landing Page Endpoint
```bash
curl http://localhost:3000/api/content/pages/holiday-sale
```

**Expected**: Returns landing page with hero banner and active sections or 404

---

#### 3. Test Admin Banner Creation (Requires Auth Token)
```bash
curl -X POST http://localhost:3000/api/content/admin/banners \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "placement": "HOME_HERO",
    "title": "Test Banner",
    "imageDesktopUrl": "https://example.com/image.jpg"
  }'
```

**Expected**: 201 Created with banner object (ADMIN/SUPER_ADMIN) or 403 Forbidden (CUSTOMER)

---

#### 4. Test Admin Page Creation
```bash
curl -X POST http://localhost:3000/api/content/admin/pages \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-page",
    "title": "Test Landing Page"
  }'
```

**Expected**: 201 Created or 409 Conflict (duplicate slug)

---

#### 5. Test Admin Section Creation
```bash
curl -X POST http://localhost:3000/api/content/admin/sections \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "landingPageId": "<page-uuid>",
    "type": "RICH_TEXT",
    "data": "{\"html\": \"<h1>Welcome</h1>\"}"
  }'
```

**Expected**: 201 Created or 404 (invalid page ID) or 409 (invalid JSON)

---

## Security Features

### Authorization
- All admin endpoints protected by JWT authentication
- Role-based access control (ADMIN, SUPER_ADMIN only)
- Public endpoints accessible without authentication

### Validation
- Input validation using class-validator
- URL validation for images and links
- Date validation for banner windows
- JSON validation for section data
- UUID validation for foreign keys

### Data Integrity
- Referential integrity checks before foreign key updates
- Unique constraint on landing page slugs
- Cascade deletion to prevent orphaned sections
- Null-safe optional relations (hero banner can be removed)

---

## Frontend Integration Examples

### Fetching Home Page Banners
```typescript
// Fetch hero banners for homepage
const response = await fetch('http://localhost:3000/api/content/banners?placement=HOME_HERO');
const banners = await response.json();

// Display banner carousel
banners.forEach(banner => {
  console.log(banner.title, banner.imageDesktopUrl, banner.ctaUrl);
});
```

---

### Fetching Landing Page
```typescript
// Fetch landing page by slug
const response = await fetch('http://localhost:3000/api/content/pages/holiday-sale');
const page = await response.json();

// Render hero banner
console.log('Hero:', page.heroBanner?.title);

// Render sections
page.sections.forEach(section => {
  const data = JSON.parse(section.data);
  switch (section.type) {
    case 'PRODUCT_GRID':
      renderProductGrid(data.productIds);
      break;
    case 'RICH_TEXT':
      renderHTML(data.html);
      break;
    // ... other section types
  }
});
```

---

### Admin Panel Integration
```typescript
// Create banner (admin)
const token = localStorage.getItem('jwt_token');

const response = await fetch('http://localhost:3000/api/content/admin/banners', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    placement: 'HOME_HERO',
    title: 'Summer Sale',
    imageDesktopUrl: 'https://cdn.example.com/summer.jpg',
    startAt: '2025-06-01T00:00:00Z',
    endAt: '2025-08-31T23:59:59Z',
    isActive: true,
  }),
});

if (response.status === 201) {
  const banner = await response.json();
  console.log('Banner created:', banner.id);
} else if (response.status === 403) {
  console.error('Unauthorized: Admin role required');
}
```

---

## Section Type Examples

### PRODUCT_GRID
**Purpose**: Display grid of featured products

**Example Data**:
```json
{
  "productIds": ["uuid1", "uuid2", "uuid3", "uuid4"],
  "columns": 4,
  "title": "Featured Products",
  "showPrices": true
}
```

---

### CATEGORY_GRID
**Purpose**: Display grid of category cards

**Example Data**:
```json
{
  "categoryIds": ["uuid1", "uuid2", "uuid3"],
  "columns": 3,
  "showImages": true
}
```

---

### RICH_TEXT
**Purpose**: Render HTML content

**Example Data**:
```json
{
  "html": "<div class='promo'><h2>Limited Time Offer</h2><p>Get 20% off...</p></div>"
}
```

---

### IMAGE
**Purpose**: Display full-width image banner

**Example Data**:
```json
{
  "desktopUrl": "https://cdn.example.com/banner.jpg",
  "mobileUrl": "https://cdn.example.com/banner-mobile.jpg",
  "altText": "Holiday Sale Banner",
  "linkUrl": "/products/sale"
}
```

---

### BANNER_CAROUSEL
**Purpose**: Rotating banner carousel

**Example Data**:
```json
{
  "bannerIds": ["uuid1", "uuid2", "uuid3"],
  "autoplay": true,
  "interval": 5000
}
```

---

## Database Seeding

Updated seed file to use new Banner schema:
```typescript
await prisma.banner.upsert({
  where: { id: '1' },
  update: {},
  create: {
    id: '1',
    placement: 'HOME_HERO',
    title: 'Welcome to Solo Ecommerce',
    subtitle: 'Discover premium products for your lifestyle',
    imageDesktopUrl: '/images/hero-banner.jpg',
    imageMobileUrl: '/images/hero-banner-mobile.jpg',
    ctaUrl: '/products',
    ctaText: 'Shop Now',
    displayOrder: 1,
    isActive: true,
  },
});
```

---

## Next Steps

### Recommended Enhancements

1. **Banner Analytics**
   - Track banner clicks and impressions
   - A/B testing support
   - Conversion rate tracking

2. **Landing Page Builder UI**
   - Drag-and-drop section reordering
   - Visual editor for section data
   - Template library

3. **Advanced Filtering**
   - Banner targeting by user role or location
   - Personalized landing pages
   - Device-specific content

4. **Caching**
   - Redis caching for public endpoints
   - Invalidate cache on admin updates
   - Improve performance

5. **Versioning**
   - Draft/Published states
   - Scheduled publishing
   - Content history and rollback

6. **Media Management**
   - Upload images directly to backend
   - Image optimization and CDN integration
   - Asset library

---

## Summary

✅ **Completed**:
- 3 new Prisma models (Banner, LandingPage, LandingSection)
- Database migration applied successfully
- 2 public endpoints (banners, pages)
- 15 admin endpoints (5 per resource)
- 6 DTOs with validation
- Date-aware banner filtering
- SEO support for landing pages
- Flexible JSON data for sections
- Full authorization with RolesGuard
- Backend server running with all endpoints mapped

**Total Endpoints**: 17 (2 public + 15 admin)

**Lines of Code**:
- Service: ~315 lines
- Controller: ~150 lines
- DTOs: ~120 lines
- Schema: ~60 lines
- **Total**: ~645 lines

**Documentation**: This file provides comprehensive API documentation and integration examples for frontend developers.

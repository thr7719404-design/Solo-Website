# Frontend Database Consumption Report

This report analyzes how the Flutter frontend in `frontend/lib/` consumes data from the backend API, mapping UI components to database tables and fields.

---

## 1. DATA MODELS & DTOs

### 1.1 Product Data Models

#### ProductDto (models/dto/product_dto.dart)
Maps to: `InvProduct`, `InvProductPricing`, `InvProductImage`, `ProductOverride`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | InvProduct | id | Yes - Product cards, detail, cart |
| `sku` | InvProduct | sku | Yes - Admin products screen |
| `name` | InvProduct | name | Yes - All product displays |
| `slug` | InvProduct | slug | Yes - URL routing |
| `description` | InvProduct | description | Yes - Product detail screen |
| `price` | InvProductPricing | priceExclVat | Yes - All product displays |
| `oldPrice` | InvProductPricing | compareAtPrice | Yes - Strikethrough price |
| `compareAtPrice` | InvProductPricing | compareAtPrice | Yes - Discount calculation |
| `priceInclVat` | InvProductPricing | priceInclVat | **UNUSED** - Fetched but not displayed |
| `imageUrl` | InvProductImage | url (primary) | Yes - Product cards/detail |
| `images` | InvProductImage | url (all) | Yes - Product detail gallery |
| `category` | Category | (relation) | Yes - Product cards, filtering |
| `brand` | Brand | (relation) | Yes - Product cards, filtering |
| `department` | Department | (relation) | Partial - Admin only |
| `rating` | ProductOverride? | rating | Yes - Star ratings |
| `reviewCount` | ProductOverride? | reviewCount | Yes - Review count display |
| `stock` | InvProduct | stockQuantity | Limited - "In Stock" badge |
| `inStock` | InvProduct | calculated | Yes - Stock badge |
| `isActive` | InvProduct | isActive | Admin only |
| `isFeatured` | ProductOverride | isFeatured | Yes - Featured section |
| `isNew` | ProductOverride | isNew | Yes - "NEW" badge |
| `isBestSeller` | ProductOverride | isBestSeller | Yes - Bestseller badge |
| `discount` | Calculated | - | Yes - Discount % badge |
| `specifications` | InvProduct | specifications | Yes - Product detail |
| `features` | InvProduct | features | **UNUSED** - Fetched but not displayed |
| `dimensions` | InvProduct | dimensions | **UNUSED** - Fetched but not displayed |
| `packaging` | InvProduct | packaging | **UNUSED** - Fetched but not displayed |
| `override` | ProductOverride | (relation) | Admin only (homepageRank, categoryRank) |
| `createdAt` | InvProduct | createdAt | **UNUSED** in storefront |
| `updatedAt` | InvProduct | updatedAt | **UNUSED** in storefront |

#### Product (models/product.dart) - UI Model
Simplified model for storefront display:

| Field | Source | Used In |
|-------|--------|---------|
| `id` | ProductDto.id | Navigation, cart, favorites |
| `name` | ProductDto.name | All product displays |
| `brand` | ProductDto.brand.name | Product cards |
| `description` | ProductDto.description | Product detail |
| `price` | ProductDto.price | All price displays |
| `originalPrice` | ProductDto.oldPrice | Discount strikethrough |
| `imageUrl` | ProductDto.imageUrl | Product thumbnails |
| `images` | ProductDto.images | Product detail gallery |
| `category` | ProductDto.category.name | Category filters |
| `subcategory` | - | **NOT USED** - Always null |
| `rating` | ProductDto.rating | Star ratings |
| `reviewCount` | ProductDto.reviewCount | Review badges |
| `isFavorite` | Local state | Favorites functionality |
| `isNew` | ProductDto.isNew | "NEW" badge |
| `colors` | - | **NOT USED** - Empty array |
| `sizes` | - | **NOT USED** - Empty array |

---

### 1.2 Category Data Models

#### CategoryDto (models/dto/product_dto.dart)
Maps to: `Category`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | Category | id | Yes - Navigation, filtering |
| `name` | Category | name | Yes - Category display |
| `slug` | Category | slug | Yes - URL routing |
| `description` | Category | description | **UNUSED** in storefront |
| `image` | Category | image | Yes - Category tiles |
| `displayOrder` | Category | displayOrder | Yes - Ordering |
| `isActive` | Category | isActive | Admin filtering |
| `departmentId` | Category | departmentId | Admin only |
| `department` | Department | (relation) | Admin only |
| `parentId` | Category | parentId | Subcategory nesting |
| `children` | Category | (self-relation) | Subcategory dropdown |
| `productCount` | Calculated | - | Yes - Product counts |
| `subcategories` | Category | (relation) | Subcategory display |

#### Category (models/category.dart) - UI Model

| Field | Source | Used In |
|-------|--------|---------|
| `id` | CategoryDto.id | Navigation |
| `name` | CategoryDto.name | Display |
| `slug` | CategoryDto.slug | URLs |
| `icon` | - | **HARDCODED** - Empty |
| `imageUrl` | CategoryDto.image | Category tiles |
| `productCount` | CategoryDto.productCount | Badges |

---

### 1.3 Brand Data Models

#### BrandDto (models/dto/product_dto.dart)
Maps to: `Brand`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | Brand | id | Yes - Filtering |
| `name` | Brand | name | Yes - Product cards, filters |
| `slug` | Brand | slug | Yes - URL routing |
| `description` | Brand | description | **UNUSED** |
| `logo` | Brand | logo | Yes - Brand strip |
| `website` | Brand | website | **UNUSED** |
| `isActive` | Brand | isActive | Admin filtering |
| `productCount` | Calculated | - | Admin dashboard |

---

### 1.4 Department Data Models

#### DepartmentDto (models/dto/product_dto.dart)
Maps to: `Department`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | Department | id | Admin filtering |
| `name` | Department | name | Admin only |
| `slug` | Department | slug | Admin only |
| `description` | Department | description | **UNUSED** |
| `icon` | Department | icon | **UNUSED** |
| `image` | Department | image | **UNUSED** |
| `sortOrder` | Department | sortOrder | Admin ordering |
| `displayOrder` | Department | displayOrder | Admin ordering |
| `isActive` | Department | isActive | Admin filtering |
| `categoryCount` | Calculated | - | Admin dashboard |
| `productCount` | Calculated | - | Admin dashboard |

---

### 1.5 User/Auth Data Models

#### UserDto (models/dto/auth_dto.dart)
Maps to: `User`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | User | id | Internal reference |
| `email` | User | email | Yes - Profile, login |
| `firstName` | User | firstName | Yes - Profile, greeting |
| `lastName` | User | lastName | Yes - Profile |
| `phone` | User | phone | Yes - Profile |
| `role` | User | role | Admin access control |
| `emailVerified` | User | emailVerified | Verification status |
| `isActive` | User | isActive | Admin management |
| `createdAt` | User | createdAt | **UNUSED** in storefront |
| `lastLoginAt` | User | lastLoginAt | **UNUSED** |

---

### 1.6 Order Data Models

Orders are consumed via raw JSON (no typed DTO):

| JSON Field | DB Table | DB Field | Displayed In UI |
|------------|----------|----------|-----------------|
| `id` | Order | id | Order detail links |
| `orderNumber` | Order | orderNumber | Yes - Order list, confirmation |
| `status` | Order | status | Yes - Order status badge |
| `total` | Order | total | Yes - Order list |
| `shippingAddress` | ShippingAddress | (relation) | Yes - Order detail |
| `items` | OrderItem | (relation) | Yes - Order detail |
| `createdAt` | Order | createdAt | Yes - Order date |
| `customerName` | User | firstName + lastName | Admin dashboard |

---

### 1.7 Address Data Models

#### Address (models/address.dart)
Maps to: `Address`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | Address | id | Internal reference |
| `label` | Address | label | Address selection |
| `firstName` | Address | firstName | Yes - Checkout, addresses |
| `lastName` | Address | lastName | Yes - Checkout, addresses |
| `email` | Address | email | **UNUSED** - Optional |
| `company` | Address | company | **UNUSED** - Optional |
| `addressLine1` | Address | addressLine1 | Yes - Display |
| `addressLine2` | Address | addressLine2 | Yes - Display |
| `city` | Address | city | Yes - Display |
| `state` | Address | state | Yes - Display |
| `postalCode` | Address | postalCode | Yes - Display |
| `country` | Address | country | Yes - Display |
| `phone` | Address | phone | Yes - Display |
| `isDefault` | Address | isDefault | Default selection |
| `createdAt` | Address | createdAt | **UNUSED** |
| `updatedAt` | Address | updatedAt | **UNUSED** |

---

### 1.8 Cart Data Models

#### CartItem (models/cart_item.dart & providers/cart_provider.dart)
**LOCAL ONLY** - Cart is stored in provider state, not fetched from DB

| Field | Source | Used In |
|-------|--------|---------|
| `id` | Generated | Item reference |
| `productId` | Product.id | Deduplication |
| `name` | Product.name | Cart display |
| `imageUrl` | Product.imageUrl | Cart thumbnails |
| `price` | Product.price | Cart totals |
| `quantity` | User input | Cart quantity |
| `size` | - | **UNUSED** - Optional |
| `color` | - | **UNUSED** - Optional |

---

### 1.9 Blog/Content Data Models

#### BlogPost (models/blog.dart)
Maps to: `BlogPost`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | BlogPost | id | Navigation |
| `title` | BlogPost | title | Yes - Blog list/detail |
| `slug` | BlogPost | slug | Yes - URL routing |
| `excerpt` | BlogPost | excerpt | Yes - Blog list |
| `content` | BlogPost | content | Yes - Blog detail |
| `featuredImage` | BlogPost | featuredImage | Yes - Blog images |
| `author` | BlogPost | author | Yes - Blog meta |
| `publishedAt` | BlogPost | publishedAt | Yes - Date display |
| `categoryName` | BlogCategory | name | Yes - Category label |
| `tags` | BlogPostTag | (relation) | Yes - Tag display |
| `readTime` | BlogPost | readTime | Yes - "X min read" |

**Note:** Blog currently uses MOCK DATA - API integration TODO

#### BannerDto (models/dto/content_dto.dart)
Maps to: `Banner`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | Banner | id | Admin reference |
| `placement` | Banner | placement | Banner targeting |
| `title` | Banner | title | Yes - Banner overlay |
| `subtitle` | Banner | subtitle | Yes - Banner overlay |
| `ctaText` | Banner | ctaText | Yes - Button text |
| `ctaUrl` | Banner | ctaUrl | Yes - Link navigation |
| `imageDesktopUrl` | Banner | imageDesktopUrl | Yes - Desktop display |
| `imageMobileUrl` | Banner | imageMobileUrl | Yes - Mobile display |
| `startAt` | Banner | startAt | Display scheduling |
| `endAt` | Banner | endAt | Display scheduling |
| `displayOrder` | Banner | displayOrder | Banner ordering |
| `isActive` | Banner | isActive | Display filtering |
| `createdAt` | Banner | createdAt | Admin only |
| `updatedAt` | Banner | updatedAt | Admin only |

#### LandingPageDto (models/dto/content_dto.dart)
Maps to: `LandingPage`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | LandingPage | id | Internal reference |
| `slug` | LandingPage | slug | URL routing |
| `title` | LandingPage | title | SEO |
| `description` | LandingPage | description | **UNUSED** |
| `metaTitle` | LandingPage | metaTitle | Yes - Browser title |
| `metaDescription` | LandingPage | metaDescription | Yes - Meta tags |
| `heroBannerId` | LandingPage | heroBannerId | Hero banner |
| `heroBanner` | Banner | (relation) | Hero display |
| `seoTitle` | LandingPage | seoTitle | SEO fallback |
| `seoDescription` | LandingPage | seoDescription | SEO fallback |
| `isActive` | LandingPage | isActive | Page filtering |
| `sections` | LandingSection | (relation) | Homepage layout |

#### LandingSectionDto (models/dto/content_dto.dart)
Maps to: `LandingSection`

| DTO Field | DB Table | DB Field | Displayed In UI |
|-----------|----------|----------|-----------------|
| `id` | LandingSection | id | Admin reference |
| `landingPageId` | LandingSection | landingPageId | Parent relation |
| `type` | LandingSection | type | Section renderer |
| `title` | LandingSection | title | Section headers |
| `subtitle` | LandingSection | subtitle | Section subheaders |
| `data` | LandingSection | data (JSON) | Section content |
| `config` | LandingSection | config (JSON) | Section styling |
| `displayOrder` | LandingSection | displayOrder | Section ordering |
| `isActive` | LandingSection | isActive | Display filtering |

---

### 1.10 Loyalty Data Models

Consumed via raw JSON from `/account/loyalty`:

| JSON Field | DB Table | DB Field | Displayed In UI |
|------------|----------|----------|-----------------|
| `balanceAed` | LoyaltyWallet | balance | Yes - Loyalty balance |
| `totalEarnedAed` | LoyaltyWallet | totalEarned | Yes - Earned display |
| `totalRedeemedAed` | LoyaltyWallet | totalRedeemed | Yes - Redeemed display |
| `transactions` | LoyaltyTransaction | (relation) | Yes - Transaction history |

---

### 1.11 Admin Dashboard Data Models

#### DashboardStatsDto (models/dto/admin_dto.dart)
Maps to: Aggregated queries

| DTO Field | Source | Displayed In UI |
|-----------|--------|-----------------|
| `ordersToday` | Order COUNT | Yes - Stats card |
| `ordersThisWeek` | Order COUNT | Yes - Stats card |
| `ordersThisMonth` | Order COUNT | Yes - Stats card |
| `revenueToday` | Order SUM | Yes - Revenue card |
| `revenueThisWeek` | Order SUM | Yes - Revenue card |
| `revenueThisMonth` | Order SUM | Yes - Revenue card |
| `totalCustomers` | User COUNT | Yes - Stats card |
| `newCustomersToday` | User COUNT | Yes - Stats card |
| `topProducts` | OrderItem aggregate | Yes - Top products table |
| `lowStockProducts` | InvProduct filter | Yes - Low stock alerts |
| `activeBanners` | Banner COUNT | Yes - CMS stats |
| `totalBanners` | Banner COUNT | Yes - CMS stats |
| `recentOrders` | Order recent | Yes - Recent orders table |
| `ordersByStatus` | Order GROUP BY | Yes - Status breakdown |
| `catalogSummary` | Multiple COUNT | Yes - Catalog metrics |
| `recentActivity` | Activity log | **UNUSED** - Field exists but rarely populated |

---

## 2. SCREENS & API CONSUMPTION

### 2.1 Home Screen (screens/home_screen.dart)

**API Endpoints Called:**
- `GET /content/home` - CMS homepage layout
- `GET /products/featured` - Featured products
- `GET /products/best-sellers` - Best seller products
- `GET /products/new-arrivals` - New arrival products
- `GET /categories` - Category navigation
- `GET /content/banners` - Hero banners

**Data Fields Displayed:**
- Products: name, brand, price, oldPrice, imageUrl, isNew, isFeatured, isBestSeller
- Categories: name, imageUrl
- Banners: title, subtitle, ctaText, imageDesktopUrl/imageMobileUrl
- SEO: metaTitle, metaDescription

---

### 2.2 Product Detail Screen (screens/product_detail_screen.dart)

**API Endpoints Called:**
- `GET /products/:id/related` - Related products
- `GET /products?categoryId=X` - Same category products

**Data Fields Displayed:**
- Product: name, brand, description, price, originalPrice, images, rating, reviewCount
- Badges: isNew, discount percentage
- Related: name, brand, price, imageUrl

**Unused Fields (fetched but not shown):**
- specifications (in DTO but UI section shows "Coming Soon")
- features, dimensions, packaging

---

### 2.3 Cart Screen (screens/cart_screen.dart)

**API Endpoints Called:**
- None for cart items (stored locally)
- `GET /account/loyalty` - Loyalty balance

**Data Fields Displayed:**
- Cart items: product.name, product.brand, product.price, product.imageUrl, quantity
- Totals: subtotal, shipping, loyalty discount

---

### 2.4 Checkout Screen (screens/checkout_screen.dart)

**API Endpoints Called:**
- `GET /account/addresses` - Saved addresses
- `POST /orders` - Create order

**Data Sent:**
```json
{
  "shippingAddress": {
    "firstName", "lastName", "phone", "street", 
    "apartment", "city", "postalCode", "country"
  },
  "shippingMethod": "STANDARD",
  "paymentMethod": "CASH_ON_DELIVERY | CREDIT_CARD",
  "items": [{ "productId": int, "quantity": int }],
  "notes": null
}
```

---

### 2.5 Category Screen (screens/category_screen.dart)

**API Endpoints Called:**
- `GET /categories/:id` - Category with children
- `GET /products?categoryId=X` - Products in category

**Data Fields Displayed:**
- Category: name, children (subcategories)
- Products: name, brand, price, imageUrl, rating, isNew, discount

---

### 2.6 Search Screen (screens/search_screen.dart)

**API Endpoints Called:**
- `GET /products?search=X` - Search products
- `GET /categories` - Filter options

**Data Fields Displayed:**
- Products: name, brand, price, imageUrl, category, rating

---

### 2.7 Product List Screen (screens/product_list_screen.dart)

**API Endpoints Called:**
- `GET /products` with filters: categoryId, brandId, isFeatured, isNew, isBestSeller

**Data Fields Displayed:**
- Products: name, brand, price, imageUrl, isNew, isBestSeller, discount

---

### 2.8 My Account Screen (screens/my_account_screen.dart)

**API Endpoints Called:**
- `GET /account/profile` - User profile
- `GET /account/orders` - Order history
- `GET /account/addresses` - Saved addresses
- `GET /account/loyalty` - Loyalty balance
- `GET /account/payment-methods` - Payment methods

**Data Fields Displayed:**
- Profile: firstName, lastName, email, phone
- Orders: orderNumber, status, total, createdAt
- Addresses: all address fields
- Loyalty: balanceAed, totalEarnedAed, transactions

---

### 2.9 Blog Screens (screens/blog_list_screen.dart, blog_post_screen.dart)

**API Endpoints Called:**
- Currently using MOCK DATA (TODO: integrate with API)

**Data Fields Displayed:**
- Post: title, excerpt, content, featuredImage, author, publishedAt, categoryName, tags, readTime

---

### 2.10 Admin Dashboard (screens/admin/admin_dashboard_screen.dart)

**API Endpoints Called:**
- `GET /admin/stats` - Dashboard statistics

**Data Fields Displayed:**
- Stats: ordersToday/Week/Month, revenueToday/Week/Month
- Customers: totalCustomers, newCustomersToday
- Products: topProducts (name, sku, totalOrders, totalRevenue, totalQuantity)
- Low Stock: lowStockProducts (name, sku, stock, threshold)
- Orders: recentOrders (orderNumber, customerName, total, status, createdAt)
- Catalog: totalCategories, totalBrands, totalDepartments, totalProducts, activeProducts, featuredProducts

---

### 2.11 Admin Products Screen (screens/admin/admin_products_screen.dart)

**API Endpoints Called:**
- `GET /products` - Product list with pagination
- `DELETE /products/:id` - Delete product override

**Data Fields Displayed:**
- Products: id, sku, name, imageUrl, price, stock, isActive, isFeatured, isNew

---

## 3. SERVICES & API CALLS SUMMARY

### ProductsApi (services/api/products_api.dart)
| Method | Endpoint | Data Sent | Data Received |
|--------|----------|-----------|---------------|
| getProducts | GET /products | query params | ProductListDto |
| getProduct | GET /products/:id | - | ProductDto |
| getFeatured | GET /products/featured | limit | List<ProductDto> |
| getBestSellers | GET /products/best-sellers | limit | List<ProductDto> |
| getNewArrivals | GET /products/new-arrivals | limit | List<ProductDto> |
| getRelatedProducts | GET /products/:id/related | limit | List<ProductDto> |
| createProduct | POST /products | product data | ProductDto |
| updateProduct | PATCH /products/:id | product data | ProductDto |
| deleteProduct | DELETE /products/:id | - | - |

### AuthApi (services/api/auth_api.dart)
| Method | Endpoint | Data Sent | Data Received |
|--------|----------|-----------|---------------|
| register | POST /auth/register | email, password, firstName, lastName, phone | AuthResponseDto |
| login | POST /auth/login | email, password | AuthResponseDto |
| logout | POST /auth/logout | refreshToken | - |
| getCurrentUser | GET /auth/me | - | UserDto |
| changePassword | POST /auth/change-password | currentPassword, newPassword | - |
| forgotPassword | POST /auth/forgot-password | email | Map |
| resetPassword | POST /auth/reset-password | token, newPassword | - |
| verifyEmail | POST /auth/verify-email | token | Map |

### OrdersApi (services/api/orders_api.dart)
| Method | Endpoint | Data Sent | Data Received |
|--------|----------|-----------|---------------|
| createOrder | POST /orders | order data | Map |
| getOrders | GET /orders | - | List<Map> |
| getOrder | GET /orders/:id | - | Map |

### CategoriesApi (services/api/categories_api.dart)
| Method | Endpoint | Data Sent | Data Received |
|--------|----------|-----------|---------------|
| getCategories | GET /categories | query params | List<CategoryDto> |
| getCategory | GET /categories/:id | - | CategoryDto |
| getCategoryProducts | GET /categories/:id/products | pagination | ProductListDto |

### BrandsApi (services/api/brands_api.dart)
| Method | Endpoint | Data Sent | Data Received |
|--------|----------|-----------|---------------|
| getBrands | GET /brands | - | List<BrandDto> |
| getBrand | GET /brands/:id | - | BrandDto |
| getBrandProducts | GET /brands/:id/products | pagination | ProductListDto |

### ContentApi (services/api/content_api.dart)
| Method | Endpoint | Data Sent | Data Received |
|--------|----------|-----------|---------------|
| getHomePage | GET /content/home | - | LandingPageDto |
| getBanners | GET /content/banners | placement | List<BannerDto> |
| getLandingPage | GET /content/pages/:slug | - | LandingPageDto |

### AccountApi (services/api/account_api.dart)
| Method | Endpoint | Data Sent | Data Received |
|--------|----------|-----------|---------------|
| getProfile | GET /account/profile | - | Map |
| updateProfile | PATCH /account/profile | profile data | Map |
| getOrders | GET /account/orders | - | List |
| getAddresses | GET /account/addresses | - | List |
| createAddress | POST /account/addresses | address data | Map |
| updateAddress | PATCH /account/addresses/:id | address data | Map |
| deleteAddress | DELETE /account/addresses/:id | - | - |
| getLoyalty | GET /account/loyalty | - | Map |
| getPaymentMethods | GET /account/payment-methods | - | List |

---

## 4. UNUSED/UNDERUTILIZED DATA FIELDS

### 4.1 Product Fields Fetched But Not Displayed
| Field | Reason |
|-------|--------|
| `priceInclVat` | Not used - only priceExclVat displayed |
| `features` | Array parsed but UI shows "Coming Soon" |
| `dimensions` | Parsed but not rendered |
| `packaging` | Parsed but not rendered |
| `specifications` | Partially used - UI placeholder |
| `createdAt/updatedAt` | Timestamps not shown to customers |

### 4.2 Product Model Fields Never Populated
| Field | Status |
|-------|--------|
| `colors` | Always empty array - no color variants in API |
| `sizes` | Always empty array - no size variants in API |
| `subcategory` | Always null - not mapped from DTO |

### 4.3 Category Fields Fetched But Not Displayed
| Field | Reason |
|-------|--------|
| `description` | Exists in DTO, never shown in storefront |
| `icon` | Hardcoded to empty string |

### 4.4 Brand Fields Underutilized
| Field | Reason |
|-------|--------|
| `description` | Not displayed anywhere |
| `website` | Not displayed or linked |

### 4.5 Department Fields (Admin Only)
Departments are only used in admin screens and product filtering - not exposed to customers.

### 4.6 Blog Fields (Using Mock Data)
Blog functionality exists but uses mock data - actual BlogPost API fields are defined but not connected.

---

## 5. DATA FLOW SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE TABLES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ InvProduct ──┬──> InvProductPricing                                     │
│              ├──> InvProductImage                                        │
│              └──> ProductOverride (isFeatured, isNew, isBestSeller)     │
│ Category ──────> Department                                              │
│ Brand                                                                    │
│ User ─────────> Address                                                  │
│            └──> LoyaltyWallet ──> LoyaltyTransaction                    │
│ Order ────────> OrderItem                                                │
│ Banner                                                                   │
│ LandingPage ──> LandingSection                                          │
│ BlogPost ─────> BlogCategory, BlogPostTag                               │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST API
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND DTOs                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ProductDto ─────> Product (simplified for UI)                           │
│ CategoryDto ────> Category (simplified for UI)                          │
│ BrandDto                                                                 │
│ DepartmentDto                                                            │
│ UserDto                                                                  │
│ AuthResponseDto                                                          │
│ BannerDto                                                                │
│ LandingPageDto ─> LandingSectionDto                                     │
│ DashboardStatsDto (admin)                                               │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Provider State
┌─────────────────────────────────────────────────────────────────────────┐
│                          UI SCREENS                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ HomeScreen ────────> ProductCard, HeroBanner, CategoryTiles             │
│ ProductDetailScreen ─> ProductCard (related), Image gallery             │
│ CartScreen ─────────> CartItem list, OrderSummary                       │
│ CheckoutScreen ─────> Address form, Payment, OrderConfirmation          │
│ CategoryScreen ─────> ProductCard grid, SubcategoryChips                │
│ SearchScreen ───────> ProductCard grid, Filters                         │
│ MyAccountScreen ────> Profile, Orders, Addresses, Loyalty               │
│ AdminDashboard ─────> Stats, Tables, Charts                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. RECOMMENDATIONS

### 6.1 Remove Unused DTO Fields
Consider removing these from the API response to reduce payload size:
- `priceInclVat` (if not needed)
- `features`, `dimensions`, `packaging` (until UI is built)

### 6.2 Implement Missing Features
- **Product Variants:** `colors` and `sizes` fields exist in Product model but are never populated. Either remove or implement variant support.
- **Specifications Tab:** Currently shows placeholder - wire up to `specifications` field.
- **Blog Integration:** Replace mock data with actual API calls.

### 6.3 Add Missing API Integration
- Favorites are stored locally only - consider server-side wishlist API.
- Cart is stored locally - consider cart persistence API for logged-in users.

### 6.4 Optimize Data Loading
- Product list doesn't need full DTO - consider slim response endpoint.
- Consider GraphQL or field selection to fetch only needed fields.

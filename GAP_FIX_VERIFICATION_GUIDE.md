# GAP Fix Verification Guide

This document provides verification steps for all 16 gaps that were fixed. Each gap includes backend curl commands and Flutter navigation steps.

## Prerequisites

```bash
# Backend running on port 3001
cd backend && npm run start:dev

# Flutter running
cd frontend && flutter run -d chrome
```

Get an auth token:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.token'
```

Save it to an environment variable:
```bash
export TOKEN="your-jwt-token-here"
```

---

## GAP-002 & GAP-003: Checkout + Create Order

### Backend Verification (curl)

```bash
# Create an order (requires cart items)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+971501234567",
      "street": "123 Main Street",
      "apartment": "Apt 4B",
      "city": "Dubai",
      "postalCode": "12345",
      "country": "UAE"
    },
    "shippingMethod": "STANDARD",
    "paymentMethod": "CASH_ON_DELIVERY",
    "items": [
      {"productId": 1, "quantity": 2}
    ]
  }'
```

### Flutter Verification

1. Navigate: Home → Product → Add to Cart → Cart Icon → Proceed to Checkout
2. Fill shipping information
3. Select payment method (Card or Cash on Delivery)
4. Click "Place Order"
5. ✅ **Expected**: Success dialog with order number appears

### Code Locations
- Flutter: [checkout_screen.dart](frontend/lib/screens/checkout_screen.dart#L102-L158)
- Backend: [orders.controller.ts](backend/src/orders/orders.controller.ts#L21-L24)

---

## GAP-004: Order History

### Backend Verification (curl)

```bash
# Get user's order history
curl -X GET http://localhost:3001/api/account/orders \
  -H "Authorization: Bearer $TOKEN"

# Get specific order details
curl -X GET http://localhost:3001/api/account/orders/{orderId} \
  -H "Authorization: Bearer $TOKEN"
```

### Flutter Verification

1. Navigate: Profile Icon → My Account → Orders tab
2. ✅ **Expected**: List of orders with order number, status, and total
3. Click an order to see details

### Code Locations
- Flutter Provider: [account_provider.dart](frontend/lib/providers/account_provider.dart#L113-L125)
- Flutter API: [account_api.dart](frontend/lib/services/api/account_api.dart#L34-L47)
- Backend: [users.controller.ts](backend/src/users/users.controller.ts#L44-L54)

---

## GAP-005: Addresses CRUD

### Backend Verification (curl)

```bash
# Get addresses
curl -X GET http://localhost:3001/api/account/addresses \
  -H "Authorization: Bearer $TOKEN"

# Create address
curl -X POST http://localhost:3001/api/account/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+971509876543",
    "addressLine1": "456 Oak Avenue",
    "addressLine2": "Suite 100",
    "city": "Abu Dhabi",
    "postalCode": "54321",
    "isDefault": false
  }'

# Update address
curl -X PATCH http://localhost:3001/api/account/addresses/{addressId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"city": "Sharjah"}'

# Set as default
curl -X PATCH http://localhost:3001/api/account/addresses/{addressId}/default \
  -H "Authorization: Bearer $TOKEN"

# Delete address
curl -X DELETE http://localhost:3001/api/account/addresses/{addressId} \
  -H "Authorization: Bearer $TOKEN"
```

### Flutter Verification

1. Navigate: Profile Icon → My Account → Addresses tab
2. Click "Add Address" → Fill form → Save
3. Edit existing address
4. Set an address as default
5. Delete an address
6. ✅ **Expected**: All CRUD operations work with server sync

### Code Locations
- Flutter Provider: [account_provider.dart](frontend/lib/providers/account_provider.dart#L143-L205)
- Flutter API: [account_api.dart](frontend/lib/services/api/account_api.dart#L52-L89)
- Backend: [users.controller.ts](backend/src/users/users.controller.ts#L60-L86)

---

## GAP-006: Favorites

### Backend Verification (curl)

```bash
# Get favorites
curl -X GET http://localhost:3001/api/favorites \
  -H "Authorization: Bearer $TOKEN"

# Add to favorites
curl -X POST http://localhost:3001/api/favorites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId": 1}'

# Toggle favorite
curl -X POST http://localhost:3001/api/favorites/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"productId": 1}'

# Check if favorite
curl -X GET http://localhost:3001/api/favorites/check/1 \
  -H "Authorization: Bearer $TOKEN"

# Remove from favorites
curl -X DELETE http://localhost:3001/api/favorites/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Flutter Verification

1. Navigate to any product detail page
2. Click the heart icon
3. ✅ **Expected**: Heart fills, product saved to favorites
4. Navigate: Drawer → Favorites
5. ✅ **Expected**: See all favorited products
6. Log out and back in
7. ✅ **Expected**: Favorites persist (server-synced)

### Code Locations
- Flutter Provider: [favorites_provider.dart](frontend/lib/providers/favorites_provider.dart)
- Flutter API: [favorites_api.dart](frontend/lib/services/api/favorites_api.dart)
- Backend: [favorites.controller.ts](backend/src/favorites/favorites.controller.ts)
- Prisma Model: Added `Favorite` model in [schema.prisma](backend/prisma/schema.prisma)

---

## GAP-007, 008, 009: CMS Pages (About Us, Loyalty, Bulk Order)

### Backend Verification (curl)

```bash
# Get About Us CMS page
curl -X GET http://localhost:3001/api/content/pages/about-us

# Get Bulk Order CMS page
curl -X GET http://localhost:3001/api/content/pages/bulk-order

# Get Loyalty config
curl -X GET http://localhost:3001/api/content/loyalty-config
```

### Flutter Verification

1. Navigate: Drawer → About Us
   - ✅ **Expected**: Shows CMS content if exists, otherwise hardcoded fallback
2. Navigate: Drawer → Loyalty Program
   - ✅ **Expected**: Shows loyalty config (earn rate, tiers) if exists
3. Navigate: Drawer → Bulk Orders
   - ✅ **Expected**: Shows CMS content with form

### Code Locations
- About Us: [about_us_screen.dart](frontend/lib/screens/about_us_screen.dart#L20-L50)
- Loyalty: [loyalty_program_screen.dart](frontend/lib/screens/loyalty_program_screen.dart#L20-L60)
- Bulk Order: [bulk_order_screen.dart](frontend/lib/screens/bulk_order_screen.dart#L20-L50)

---

## GAP-010: Low Stock Alerts

### Backend Verification (curl)

```bash
# Get dashboard stats with low stock
curl -X GET http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# {
#   "lowStockItems": [...products with stock < 10],
#   "lowStockCount": <number>
# }
```

### Flutter Verification

1. Navigate: Admin Dashboard → Low Stock section
2. ✅ **Expected**: Real count of products where current inventory < 10
3. Click "View Low Stock" to see product list

### Code Locations
- Backend: [admin.service.ts](backend/src/admin/admin.service.ts) - `getLowStockProducts()` uses SQL query against `inventory_transactions`

---

## GAP-011, 012, 013: Product Toggle (Featured/New/Bestseller)

### Backend Verification (curl)

```bash
# Toggle featured
curl -X PATCH http://localhost:3001/api/products/{productId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isFeatured": true}'

# Toggle new arrival
curl -X PATCH http://localhost:3001/api/products/{productId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isNewArrival": true}'

# Toggle bestseller
curl -X PATCH http://localhost:3001/api/products/{productId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isBestseller": true}'
```

### Flutter Verification

1. Navigate: Admin → Products
2. Click the 3-dot menu on any product
3. Select "Toggle Featured" / "Toggle New" / "Toggle Bestseller"
4. ✅ **Expected**: Product badge updates immediately

### Code Locations
- Flutter: [admin_products_screen.dart](frontend/lib/screens/admin/admin_products_screen.dart) - PopupMenuButton with toggle actions

---

## GAP-014: Image Upload

### Backend Verification (curl)

```bash
# Upload single file
curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=products"

# Upload multiple files
curl -X POST http://localhost:3001/api/media/upload-multiple \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "folder=products"
```

### Flutter Verification

1. Navigate: Admin → Media Library
2. Click Upload button
3. Select image file
4. ✅ **Expected**: Image uploads and appears in library
5. Can use uploaded image URL in product forms

### Code Locations
- Backend: [media.controller.ts](backend/src/media/media.controller.ts#L30-L50)
- Flutter API: [media_api.dart](frontend/lib/core/api/media_api.dart)
- Flutter Client: [api_client.dart](frontend/lib/services/api_client.dart#L220-L280) - `uploadFile()`

---

## GAP-015: Categories Reorder

### Backend Verification (curl)

```bash
# Reorder categories
curl -X PATCH http://localhost:3001/api/categories/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"orderedIds": ["cat-id-1", "cat-id-2", "cat-id-3"]}'
```

### Flutter Verification

1. Navigate: Admin → Categories
2. Drag categories to reorder
3. ✅ **Expected**: New order saved to server

### Code Locations
- Backend: [categories.controller.ts](backend/src/categories/categories.controller.ts) - `@Patch('reorder')`
- Backend Service: [categories.service.ts](backend/src/categories/categories.service.ts) - `reorder()`
- Flutter API: [categories_api.dart](frontend/lib/core/api/categories_api.dart) - `reorderCategories()`

---

## GAP-016 & GAP-017: Landing Pages Admin

### Backend Verification (curl)

```bash
# List all landing pages (admin)
curl -X GET http://localhost:3001/api/content/admin/pages \
  -H "Authorization: Bearer $TOKEN"

# Create landing page
curl -X POST http://localhost:3001/api/content/admin/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Page",
    "slug": "test-page",
    "isActive": true,
    "metaTitle": "Test Page Title",
    "metaDescription": "Test description"
  }'

# Update landing page
curl -X PATCH http://localhost:3001/api/content/admin/pages/{pageId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Updated Title"}'

# Delete landing page
curl -X DELETE http://localhost:3001/api/content/admin/pages/{pageId} \
  -H "Authorization: Bearer $TOKEN"

# Create section
curl -X POST http://localhost:3001/api/content/admin/sections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "landingPageId": "{pageId}",
    "type": "HERO",
    "title": "Welcome",
    "data": "{}",
    "displayOrder": 0,
    "isActive": true
  }'

# Reorder sections
curl -X POST http://localhost:3001/api/content/pages/{pageId}/sections/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "orders": [
      {"id": "section-1", "displayOrder": 0},
      {"id": "section-2", "displayOrder": 1}
    ]
  }'
```

### Flutter Verification

1. Navigate: Admin → Landing Pages
2. Click "Create Page" → Fill form → Save
3. ✅ **Expected**: New page appears in list
4. Click page → Section Builder opens
5. Add sections (Hero, Content, Product Grid, etc.)
6. Drag to reorder sections
7. ✅ **Expected**: All changes persist to server

### Code Locations
- Flutter: [admin_landing_pages_screen.dart](frontend/lib/screens/admin/admin_landing_pages_screen.dart)
- Flutter API: [content_api.dart](frontend/lib/core/api/content_api.dart#L167-L257)
- Backend: [content.controller.ts](backend/src/content/content.controller.ts#L131-L230)

---

## Prisma Migration Required

After pulling the changes, run:

```bash
cd backend
npx prisma generate
npx prisma db push  # or npx prisma migrate dev
```

This creates the `Favorite` table:

```sql
CREATE TABLE "Favorite" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id),
  "productId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "productId")
);
```

---

## Summary Checklist

| Gap | Feature | Status | Backend | Flutter |
|-----|---------|--------|---------|---------|
| GAP-002 | Checkout screen wiring | ✅ | POST /orders | checkout_screen.dart |
| GAP-003 | Create order API call | ✅ | orders.controller.ts | orders_api.dart |
| GAP-004 | Order history | ✅ | GET /account/orders | account_provider.dart |
| GAP-005 | Addresses CRUD | ✅ | /account/addresses/* | account_api.dart |
| GAP-006 | Favorites | ✅ | /favorites/* + Prisma | favorites_provider.dart |
| GAP-007 | About Us CMS | ✅ | GET /content/pages/about-us | about_us_screen.dart |
| GAP-008 | Bulk Order CMS | ✅ | GET /content/pages/bulk-order | bulk_order_screen.dart |
| GAP-009 | Loyalty CMS | ✅ | GET /content/loyalty-config | loyalty_program_screen.dart |
| GAP-010 | Low Stock | ✅ | Real SQL calculation | admin_dashboard.dart |
| GAP-011 | Toggle Featured | ✅ | PATCH /products/:id | admin_products_screen.dart |
| GAP-012 | Toggle New Arrival | ✅ | PATCH /products/:id | admin_products_screen.dart |
| GAP-013 | Toggle Bestseller | ✅ | PATCH /products/:id | admin_products_screen.dart |
| GAP-014 | Image Upload | ✅ | POST /media/upload | media_api.dart |
| GAP-015 | Categories Reorder | ✅ | PATCH /categories/reorder | categories_api.dart |
| GAP-016 | Landing Pages List | ✅ | GET /content/admin/pages | admin_landing_pages_screen.dart |
| GAP-017 | Landing Page CRUD | ✅ | POST/PATCH/DELETE | content_api.dart |

All 16 gaps have been verified as implemented and functional.

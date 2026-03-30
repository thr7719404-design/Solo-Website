# Product Override Strategy

## Overview

This document explains the **Product Override Strategy** implemented in the Products module. This architecture separates immutable product catalog data (stored in `inventory_db`) from mutable merchandising customizations (stored in the application database).

## Architecture

### Dual Database Design

1. **Inventory DB (`inventory_db`)** - Read-Only Catalog
   - Contains the authoritative product catalog (805 products)
   - Managed by inventory/operations team
   - Tables: products, product_pricing, product_images, product_dimensions, product_packaging, product_specifications
   - Products have base flags: `is_featured`, `is_new`, `is_best_seller`
   - API **NEVER** writes to this database

2. **Application DB (`solo_ecommerce`)** - Merchandising Overrides
   - Contains the `product_overrides` table
   - Managed by marketing/merchandising team
   - Stores customizations that override inventory defaults
   - Includes audit trail (createdBy, updatedBy, timestamps)

### ProductOverride Model

```prisma
model ProductOverride {
  id            String   @id @default(uuid())
  inventorySku  String   @unique
  inventoryId   Int?

  // Flag overrides (null = use inventory value)
  isFeatured    Boolean?
  isNew         Boolean?
  isBestSeller  Boolean?

  // Merchandising
  homepageRank  Int?
  categoryRank  Int?

  // Price overrides
  customPrice         Decimal? @db.Decimal(10, 2)
  customSalePrice     Decimal? @db.Decimal(10, 2)
  customPriceInclVat  Decimal? @db.Decimal(10, 2)

  // Content overrides
  customImagesJson      String?  @db.Text
  customDescription     String?  @db.Text
  customLongDescription String?  @db.Text

  // SEO overrides
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?

  // Audit
  notes     String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?

  @@index([inventorySku])
  @@index([isFeatured])
  @@index([isNew])
  @@index([isBestSeller])
  @@index([homepageRank])
  @@map("product_overrides")
}
```

## Merge Strategy

### Precedence Rule

**Override values always win over inventory values**

```typescript
// Null-coalescing merge
const isFeatured = override?.isFeatured ?? product.isFeatured;
const price = override?.customPrice ?? product.pricing?.listPrice;
const description = override?.customDescription ?? product.description;
```

### Implementation Pattern

All query methods follow this pattern:

1. **Fetch Products** - Query inventory_db for base product data
2. **Fetch Overrides** - Single batch query for all ProductOverride records
3. **Build Map** - Create `Map<sku, override>` for O(1) lookups
4. **Apply Filtering** - Filter using merged values (override ?? inventory)
5. **Apply Sorting** - Sort by homepageRank if any products have it
6. **Transform** - Pass override to transformation method

Example from `findAll()`:

```typescript
// Fetch products from inventory_db
const products = await this.inventoryPrisma.product.findMany({
  where: { /* category, brand, search filters */ },
  take: limit * 3, // Fetch extra for post-merge filtering
});

// Fetch overrides in single query
const skus = products.map(p => p.sku);
const overrides = await this.prisma.productOverride.findMany({
  where: { inventorySku: { in: skus } },
});

// Build map for fast lookups
const overrideMap = new Map(overrides.map(o => [o.inventorySku, o]));

// Filter by merged values
filteredProducts = products.filter(product => {
  const override = overrideMap.get(product.sku);
  return override?.isFeatured ?? product.isFeatured;
});

// Sort by homepageRank
if (filteredProducts.some(p => overrideMap.get(p.sku)?.homepageRank)) {
  filteredProducts.sort((a, b) => {
    const rankA = overrideMap.get(a.sku)?.homepageRank ?? 999999;
    const rankB = overrideMap.get(b.sku)?.homepageRank ?? 999999;
    return rankA - rankB;
  });
}

// Transform with overrides
return filteredProducts.map(product => 
  this.transformProductToApiFormat(product, false, overrideMap.get(product.sku))
);
```

## API Endpoints

### Query Endpoints (Merge Inventory + Overrides)

All read endpoints merge inventory data with overrides:

- **GET /products** - List with filters (page, limit, category, brand, price range, flags)
- **GET /products/:id** - Single product details
- **GET /products/featured** - Featured products (sorted by homepageRank)
- **GET /products/best-sellers** - Best sellers (sorted by homepageRank)
- **GET /products/new-arrivals** - New arrivals (sorted by homepageRank)
- **GET /products/:id/related** - Related products

### Admin Endpoints (Write to ProductOverride Only)

Admin endpoints **NEVER** mutate inventory_db:

#### POST /products (Create Override)

```typescript
async create(createProductDto: CreateProductDto, userId?: string) {
  // 1. Verify product exists in inventory_db
  const inventoryProduct = await this.inventoryPrisma.product.findUnique({
    where: { sku: createProductDto.sku },
  });

  if (!inventoryProduct) {
    throw new NotFoundException(
      'Product not found in inventory. Products must be added to inventory_db first.'
    );
  }

  // 2. Create override
  const override = await this.prisma.productOverride.create({
    data: {
      inventorySku: inventoryProduct.sku,
      inventoryId: inventoryProduct.id,
      isFeatured: createProductDto.isFeatured,
      // ... other override fields
      createdBy: userId,
    },
  });

  // 3. Return merged product
  return this.transformProductToApiFormat(inventoryProduct, true, override);
}
```

#### PATCH /products/:id (Update Override)

```typescript
async update(slugOrId: string, updateProductDto: UpdateProductDto, userId?: string) {
  // 1. Find product in inventory_db
  const inventoryProduct = await this.inventoryPrisma.product.findFirst({
    where: { OR: [{ id: parseInt(slugOrId) }, { sku: slugOrId }] },
  });

  // 2. Map DTO fields to override fields
  const overrideData = {
    inventorySku: inventoryProduct.sku,
    isFeatured: updateProductDto.isFeatured,
    customPrice: updateProductDto.price,
    customDescription: updateProductDto.description,
    customImagesJson: updateProductDto.images ? JSON.stringify(updateProductDto.images) : null,
    // ... other mappings
    updatedBy: userId,
  };

  // 3. Upsert override
  const override = await this.prisma.productOverride.upsert({
    where: { inventorySku: inventoryProduct.sku },
    create: { ...overrideData, createdBy: userId },
    update: overrideData,
  });

  // 4. Return merged product
  return this.transformProductToApiFormat(fullProduct, true, override);
}
```

#### DELETE /products/:id (Remove Override)

```typescript
async remove(slugOrId: string) {
  // Find product in inventory_db
  const inventoryProduct = await this.inventoryPrisma.product.findFirst({
    where: { OR: [{ id: parseInt(slugOrId) }, { sku: slugOrId }] },
  });

  // Delete override (resets product to inventory defaults)
  await this.prisma.productOverride.delete({
    where: { inventorySku: inventoryProduct.sku },
  });

  return { message: 'Product override removed successfully' };
}
```

## Homepage Ranking

Products can be ranked for homepage display using `homepageRank`:

- Lower rank = higher priority (rank 1 shows first)
- Products without rank default to 999999 (sorted last)
- Ranking is applied AFTER filtering by flags

Example:
```typescript
// Set homepage rank for featured products
await prisma.productOverride.upsert({
  where: { inventorySku: 'BOWL-001' },
  create: {
    inventorySku: 'BOWL-001',
    isFeatured: true,
    homepageRank: 1, // Show first
  },
  update: {
    homepageRank: 1,
  },
});
```

## API Response Format

Products include override metadata for admin use:

```json
{
  "id": "123",
  "sku": "BOWL-001",
  "name": "Hand-Painted Ceramic Bowl",
  "price": 45.99,
  "isFeatured": true,
  "isNew": false,
  "_override": {
    "id": "uuid",
    "homepageRank": 1,
    "categoryRank": null
  }
}
```

The `_override` field shows:
- Override exists for this product
- Homepage/category ranking
- Override ID for admin reference

## Benefits

1. **Separation of Concerns**
   - Inventory team manages catalog in `inventory_db`
   - Marketing team customizes merchandising via overrides
   - No conflicts or accidental data overwrites

2. **Audit Trail**
   - All merchandising changes tracked (createdBy, updatedBy, timestamps)
   - Can see who made what changes and when

3. **Flexibility**
   - Override any field without touching inventory
   - Reset to inventory defaults by deleting override
   - Test merchandising changes without affecting source data

4. **Data Integrity**
   - Inventory data remains immutable from API
   - Single source of truth for product specs
   - Overrides are clearly separated

5. **Performance**
   - Batch queries for overrides (one query per request)
   - Map-based lookups O(1)
   - Indexes on frequently queried fields

## Migration

The override system was added via migration:

```bash
npx prisma migrate dev --name add_product_overrides
```

Generated migration: `20251227204049_add_product_overrides/migration.sql`

Created table `product_overrides` with:
- 19 columns (id, SKU reference, override fields, audit fields)
- 6 indexes (inventorySku unique, flags, homepageRank)

## Testing Considerations

Unit tests should cover:

1. **Override Merge Logic**
   - Override values take precedence
   - Null overrides fall back to inventory
   - Multiple overrides in single query

2. **Homepage Ranking**
   - Products with ranks sorted correctly
   - Products without ranks appear last
   - Ranking applies after filtering

3. **Price Overrides**
   - Custom price used in filtering
   - Custom sale price handled correctly
   - VAT price override applied

4. **Flag Overrides**
   - isFeatured override works
   - isNew override works
   - isBestSeller override works
   - Null override uses inventory value

5. **Admin Operations**
   - Create only works for existing inventory products
   - Update creates/updates override only
   - Delete removes override, not inventory product

## Example Usage

### Set a Product as Featured with Rank 1

```typescript
const result = await productsService.update('BOWL-001', {
  isFeatured: true,
  homepageRank: 1,
}, 'admin-user-id');
```

### Override Product Price

```typescript
const result = await productsService.update('BOWL-001', {
  price: 39.99, // Was 45.99 in inventory
  salePrice: 29.99,
}, 'admin-user-id');
```

### Override Product Images

```typescript
const result = await productsService.update('BOWL-001', {
  images: [
    { url: 'https://cdn.example.com/bowl-001-hero.jpg', isPrimary: true },
    { url: 'https://cdn.example.com/bowl-001-detail.jpg', isPrimary: false },
  ],
}, 'admin-user-id');
```

### Reset Product to Inventory Defaults

```typescript
await productsService.remove('BOWL-001');
// Product now shows inventory_db values for all fields
```

## Future Enhancements

Potential additions to the override system:

1. **Scheduled Overrides** - Time-based activation/deactivation
2. **A/B Testing** - Multiple override variants for testing
3. **Category-Specific Overrides** - Different overrides per category
4. **Bulk Operations** - Update multiple product overrides at once
5. **Override History** - Track all changes to overrides over time
6. **Preview Mode** - Preview overrides before publishing

## Conclusion

The Product Override Strategy provides a clean separation between immutable catalog data and mutable merchandising customizations. It enables teams to work independently, maintains data integrity, and provides full audit trails for compliance and debugging.

**Key Principle**: Inventory DB is the source of truth for product data. Application DB stores only customizations that override inventory defaults.

# Database Schema Diagram

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INVENTORY DATABASE SCHEMA                            │
│                              (PostgreSQL)                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│    COUNTRIES        │         │      BRANDS         │
├─────────────────────┤         ├─────────────────────┤
│ PK id (SERIAL)      │         │ PK id (SERIAL)      │
│ UK country_code     │         │ UK brand_name       │
│    country_name     │         │    description      │
│    created_at       │         │    website          │
│    updated_at       │         │    is_active        │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │                               │
           │    ┌────────────────┐         │
           │    │   DESIGNERS    │         │
           │    ├────────────────┤         │
           │    │ PK id (SERIAL) │         │
           │    │ UK designer_nm │         │
           │    │    bio         │         │
           │    │    is_active   │         │
           │    └────────┬───────┘         │
           │             │                 │
           │             │                 │
┌──────────┴──────┐      │      ┌──────────┴──────────┐
│   CATEGORIES    │      │      │    SUBCATEGORIES    │
├─────────────────┤      │      ├─────────────────────┤
│ PK id (INT)     │      │      │ PK id (INT)         │
│ UK category_nm  │      │      │ FK category_id  ────┼──┐
│    description  │      │      │    subcategory_nm   │  │
│    display_ord  │      │      │    description      │  │
│    is_active    │      │      │    display_order    │  │
└────────┬────────┘      │      └─────────────────────┘  │
         │               │                                │
         │               │                                │
         │     ┌─────────┴────────────────────────────────┘
         │     │         │
         │     │         │
   ┌─────┴─────┴─────────┴─────────────────────────────────────┐
   │                     PRODUCTS (Core Table)                  │
   ├────────────────────────────────────────────────────────────┤
   │ PK  id (SERIAL)                                            │
   │ UK  sku                                                     │
   │     sku_2025, sku_2026                                     │
   │     name, name_english                                     │
   │     description                                            │
   │ FK  category_id      ──────────────────────────────────┐   │
   │ FK  subcategory_id   (nullable)                        │   │
   │ FK  brand_id         (nullable)                        │   │
   │ FK  designer_id      (nullable)                        │   │
   │ FK  country_id       (nullable)                        │   │
   │     material, colour, size                             │   │
   │     ean, ean_secondary                                 │   │
   │     customs_tariff_number                              │   │
   │     dishwasher_safe, cleaning_maintenance              │   │
   │     is_active, is_discontinued                         │   │
   │     created_at, updated_at                             │   │
   └─────────────┬──────────────────────────────────────────┘   │
                 │                                              │
                 │                                              │
      ┌──────────┼──────────────────────────────┬───────────────┘
      │          │                              │
      │          │                              │
      │          │                              │
┌─────┴──────────┴──────┐    ┌──────────────────┴───────────────┐
│ PRODUCT_DIMENSIONS    │    │   PRODUCT_PACKAGING              │
├───────────────────────┤    ├──────────────────────────────────┤
│ PK id (SERIAL)        │    │ PK id (SERIAL)                   │
│ UK product_id     ────┼──┐ │ UK product_id     ───────────────┼──┐
│    functional_depth   │  │ │    packaging_type                │  │
│    functional_width   │  │ │    colli_size                    │  │
│    functional_height  │  │ │    colli_weight_kg               │  │
│    functional_diam    │  │ │    colli_length_cm               │  │
│    functional_cap_l   │  │ │    colli_width_cm                │  │
│    packed_weight_kg   │  │ │    colli_height_cm               │  │
│    packed_depth_cm    │  │ │    master_colli_weight_kg        │  │
│    packed_width_cm    │  │ │    master_colli_length_cm        │  │
│    packed_height_cm   │  │ │    master_colli_width_cm         │  │
│    product_weight_kg  │  │ │    master_colli_height_cm        │  │
│    technical_cap_l    │  │ │    created_at, updated_at        │  │
│    created_at         │  │ └──────────────────────────────────┘  │
│    updated_at         │  │                                       │
└───────────────────────┘  │                                       │
                           │                                       │
      ┌────────────────────┼───────────────────────────────────────┘
      │                    │
      │                    │
┌─────┴────────────────────┴───┐    ┌─────────────────────────────┐
│   PRODUCT_PRICING            │    │   PRODUCT_IMAGES            │
├──────────────────────────────┤    ├─────────────────────────────┤
│ PK id (SERIAL)               │    │ PK id (SERIAL)              │
│ FK product_id                │    │ FK product_id               │
│    rrp_aed_excl_vat          │    │    image_url                │
│    price_incl_vat            │    │    image_type               │
│    listed_price_incl_vat     │    │    alt_text                 │
│    currency (DEFAULT 'AED')  │    │    display_order            │
│    vat_rate (DEFAULT 5.00)   │    │    is_primary               │
│    is_current                │    │    created_at, updated_at   │
│    effective_from            │    └─────────────────────────────┘
│    effective_to              │
│    remarks                   │
│    created_at, updated_at    │
└──────────────────────────────┘

      ┌─────────────────────────────────┐
      │  PRODUCT_SPECIFICATIONS         │
      ├─────────────────────────────────┤
      │ PK id (SERIAL)                  │
      │ FK product_id                   │
      │    spec_key                     │
      │    spec_value                   │
      │    spec_unit                    │
      │    display_order                │
      │    created_at, updated_at       │
      │ UK (product_id, spec_key)       │
      └─────────────────────────────────┘

      ┌─────────────────────────────────┐
      │  INVENTORY_TRANSACTIONS         │
      ├─────────────────────────────────┤
      │ PK id (SERIAL)                  │
      │ FK product_id                   │
      │    transaction_type             │
      │    quantity                     │
      │    unit_cost                    │
      │    total_cost                   │
      │    reference_number             │
      │    reference_type               │
      │    location                     │
      │    transaction_date             │
      │    notes                        │
      │    created_by                   │
      │    created_at                   │
      └─────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      OPTIMIZED VIEWS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  • vw_products_complete                                        │
│    → Complete product view with all joins                     │
│    → Includes category, brand, designer, dimensions, pricing  │
│                                                                │
│  • vw_current_inventory                                        │
│    → Current stock levels by product                          │
│    → Calculated from inventory_transactions                   │
│    → Includes current pricing information                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Table Relationships

### Primary Relationships

1. **Products → Categories** (Many-to-One)
   - `products.category_id` → `categories.id`
   - Required relationship, products must have a category

2. **Products → Subcategories** (Many-to-One)
   - `products.subcategory_id` → `subcategories.id`
   - Optional relationship

3. **Subcategories → Categories** (Many-to-One)
   - `subcategories.category_id` → `categories.id`
   - Required relationship

4. **Products → Brands** (Many-to-One)
   - `products.brand_id` → `brands.id`
   - Optional relationship

5. **Products → Designers** (Many-to-One)
   - `products.designer_id` → `designers.id`
   - Optional relationship

6. **Products → Countries** (Many-to-One)
   - `products.country_id` → `countries.id`
   - Optional relationship

### Detail Table Relationships

All product detail tables have a **One-to-One** relationship with products:

- `product_dimensions.product_id` → `products.id`
- `product_packaging.product_id` → `products.id`

These have **One-to-Many** relationships:

- `product_pricing.product_id` → `products.id` (multiple prices over time)
- `product_images.product_id` → `products.id` (multiple images per product)
- `product_specifications.product_id` → `products.id` (multiple specs per product)
- `inventory_transactions.product_id` → `products.id` (multiple transactions)

## Key Constraints

### Primary Keys
- All tables use SERIAL (auto-increment) primary keys
- Exception: Categories and Subcategories use INT to match Excel data

### Unique Constraints
- `products.sku` - Ensures unique product codes
- `brands.brand_name` - Prevents duplicate brands
- `countries.country_code` - ISO country codes
- `subcategories(category_id, subcategory_name)` - Unique within category

### Foreign Key Actions

**ON DELETE CASCADE:**
- Deleting a category cascades to subcategories
- Deleting a product cascades to all its detail tables

**ON DELETE RESTRICT:**
- Cannot delete categories with products
- Cannot delete products with transactions

**ON DELETE SET NULL:**
- Deleting a brand/designer/country sets product FK to NULL

## Indexing Strategy

### Performance Indexes

```sql
-- Lookup Indexes
idx_products_sku
idx_products_ean
idx_products_name

-- Foreign Key Indexes
idx_products_category
idx_products_subcategory
idx_products_brand
idx_products_designer

-- Filter Indexes
idx_products_active
idx_pricing_current
idx_pricing_effective

-- Transaction Indexes
idx_transactions_product
idx_transactions_type
idx_transactions_date
```

## Data Flow

```
Excel File → Import Script → Master Tables → Products → Detail Tables
                                                    ↓
                                          Inventory Transactions
                                                    ↓
                                             Current Stock
```

## Storage Estimates

For 805 products:

| Table | Estimated Rows | Size |
|-------|---------------|------|
| products | 805 | ~200 KB |
| product_dimensions | 805 | ~80 KB |
| product_packaging | 805 | ~80 KB |
| product_pricing | 805 | ~60 KB |
| product_images | ~2,500 | ~150 KB |
| inventory_transactions | Growing | Variable |
| **Total** | | **~600 KB** |

With transactions (1 year, ~50K transactions): **~10-15 MB**

## Backup Strategy

```sql
-- Daily: Full backup
pg_dump -Fc inventory_db > backup_$(date +%Y%m%d).dump

-- Hourly: Transaction log
pg_dump -t inventory_transactions -Fc inventory_db > trans_$(date +%Y%m%d_%H).dump

-- Weekly: Schema only for version control
pg_dump --schema-only inventory_db > schema_$(date +%Y%m%d).sql
```

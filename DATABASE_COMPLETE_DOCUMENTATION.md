# Complete Database Documentation
## PostgreSQL Dual-Database System

**DBMS:** PostgreSQL 14+  
**Port:** 5432  
**Databases:** 2 (Application DB + Inventory DB)

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Application Database (Prisma)](#application-database-prisma)
3. [Inventory Database (inventory_db)](#inventory-database-inventory_db)
4. [Database Connections](#database-connections)
5. [Common Queries](#common-queries)
6. [Backup & Maintenance](#backup--maintenance)

---

## Database Overview

The application uses a **dual-database architecture** to separate concerns:

### 1. Application Database
- **Purpose**: User accounts, authentication, orders, cart management
- **ORM**: Prisma
- **Schema**: Defined in `backend/prisma/schema.prisma`
- **Migrations**: Tracked in `backend/prisma/migrations/`
- **Records**: Dynamic (user-generated content)

### 2. Inventory Database (inventory_db)
- **Purpose**: Product catalog, pricing, inventory management
- **Access**: Direct SQL queries
- **Schema**: Defined in `backend/database_schema.sql`
- **Records**: 805 products + master data (static catalog)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              NestJS Backend API                      │
│                                                      │
│  ┌──────────────┐         ┌──────────────────┐     │
│  │ Prisma Client│         │ Direct SQL Client │     │
│  │ (TypeScript) │         │ (pg/psycopg2)    │     │
│  └──────┬───────┘         └────────┬─────────┘     │
└─────────┼────────────────────────────┼──────────────┘
          │                            │
          ▼                            ▼
┌──────────────────────┐    ┌─────────────────────────┐
│ Application Database │    │  Inventory Database     │
│   (postgres/main)    │    │    (inventory_db)       │
│                      │    │                         │
│ • users              │    │ • products (805)        │
│ • refresh_tokens     │    │ • categories (3)        │
│ • addresses          │    │ • brands (4)            │
│ • carts              │    │ • designers (6)         │
│ • cart_items         │    │ • countries (10)        │
│ • orders             │    │ • product_pricing       │
│ • order_items        │    │ • product_dimensions    │
│ • products (cached)  │    │ • product_packaging     │
│ • categories         │    │ • product_images        │
│ • brands             │    │ • product_specifications│
│ • departments        │    │ • inventory_transactions│
│ • analytics          │    │                         │
└──────────────────────┘    └─────────────────────────┘
```

---

## Application Database (Prisma)

### Connection String

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
```

### Schema Overview

**File:** `backend/prisma/schema.prisma`

#### Entity Relationship

```
User ──┬── RefreshToken (many)
       ├── Address (many)
       ├── Cart (one)
       └── Order (many)
              └── OrderItem (many)
                     └── Product

Product ──┬── Category
          ├── Brand
          ├── Department
          └── Package (many-to-many)

Promo ──── Product (many-to-many)

AnalyticsEvent ──── User
```

---

### Tables & Models

#### 1. Users Table
```sql
Table: users
Primary Key: id (UUID)
Indexes: email, role, createdAt
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  email: string (unique, indexed)
  passwordHash: string
  firstName: string?
  lastName: string?
  phone: string?
  role: UserRole (CUSTOMER | ADMIN | SUPER_ADMIN)
  isActive: boolean (default: true)
  emailVerified: boolean (default: false)
  createdAt: DateTime
  updatedAt: DateTime
  lastLoginAt: DateTime?
}
```

**Relationships:**
- Has many: RefreshToken, Address, Order, AnalyticsEvent
- Has one: Cart

**Sample Query:**
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

---

#### 2. RefreshTokens Table
```sql
Table: refresh_tokens
Primary Key: id (UUID)
Foreign Keys: userId → users.id
Indexes: token, userId, expiresAt
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  userId: string (FK)
  token: string (unique, indexed)
  expiresAt: DateTime
  createdAt: DateTime
  isRevoked: boolean (default: false)
}
```

**Sample Query:**
```sql
SELECT * FROM refresh_tokens 
WHERE token = 'abc123...' 
  AND expires_at > NOW() 
  AND is_revoked = false;
```

---

#### 3. Addresses Table
```sql
Table: addresses
Primary Key: id (UUID)
Foreign Keys: userId → users.id
Indexes: userId, type
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  userId: string (FK)
  type: AddressType (SHIPPING | BILLING | BOTH)
  isDefault: boolean
  fullName: string
  phone: string
  street: string
  building: string?
  apartment: string?
  city: string
  state: string
  country: string
  postalCode: string
  landmark: string?
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

#### 4. Carts Table
```sql
Table: carts
Primary Key: id (UUID)
Foreign Keys: userId → users.id (unique)
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  userId: string (FK, unique)
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Relationships:**
- Belongs to: User
- Has many: CartItem

---

#### 5. CartItems Table
```sql
Table: cart_items
Primary Key: id (UUID)
Foreign Keys: cartId → carts.id, productId → products.id
Unique: (cartId, productId)
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  cartId: string (FK)
  productId: string (FK)
  quantity: int (default: 1)
  price: decimal (snapshot at add time)
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

#### 6. Orders Table
```sql
Table: orders
Primary Key: id (UUID)
Foreign Keys: userId → users.id, 
              shippingAddressId → addresses.id,
              billingAddressId → addresses.id
Indexes: userId, status, orderNumber, createdAt
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  orderNumber: string (unique, auto-generated)
  userId: string (FK)
  status: OrderStatus (PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED)
  paymentStatus: PaymentStatus (PENDING | PAID | FAILED | REFUNDED)
  paymentMethod: PaymentMethod (CARD | COD | BANK_TRANSFER)
  subtotal: decimal
  tax: decimal
  shippingCost: decimal
  discount: decimal
  total: decimal
  shippingAddressId: string (FK)
  billingAddressId: string (FK)
  notes: string?
  trackingNumber: string?
  cancellationReason: string?
  cancelledAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Order Status Flow:**
```
PENDING → CONFIRMED → SHIPPED → DELIVERED
         ↓
      CANCELLED
```

---

#### 7. OrderItems Table
```sql
Table: order_items
Primary Key: id (UUID)
Foreign Keys: orderId → orders.id, productId → products.id
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  orderId: string (FK)
  productId: string (FK)
  quantity: int
  price: decimal (frozen at order time)
  subtotal: decimal (quantity * price)
  createdAt: DateTime
}
```

---

#### 8. Products Table (Application)
```sql
Table: products
Primary Key: id (UUID)
Foreign Keys: categoryId, brandId, departmentId
Indexes: sku, slug, categoryId, brandId, departmentId, price
Full-text: name, description, sku
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  sku: string (unique, indexed)
  slug: string (unique)
  name: string (full-text indexed)
  description: string (full-text indexed)
  shortDescription: string?
  price: decimal
  compareAtPrice: decimal?
  cost: decimal?
  taxable: boolean (default: true)
  categoryId: string (FK)
  brandId: string (FK)
  departmentId: string (FK)
  mainImage: string
  images: string[] (array)
  thumbnail: string?
  stock: int (default: 0)
  lowStockThreshold: int (default: 10)
  weight: decimal?
  dimensions: Json?
  specifications: Json?
  features: string[] (array)
  tags: string[] (array)
  rating: decimal (default: 0)
  reviewCount: int (default: 0)
  viewCount: int (default: 0)
  purchaseCount: int (default: 0)
  isFeatured: boolean (default: false)
  isNew: boolean (default: false)
  isBestSeller: boolean (default: false)
  isActive: boolean (default: true)
  publishedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

#### 9. Categories Table
```sql
Table: categories
Primary Key: id (UUID)
Indexes: slug, parentId
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  name: string
  slug: string (unique)
  description: string?
  imageUrl: string?
  icon: string?
  parentId: string? (FK, self-reference)
  displayOrder: int (default: 0)
  isActive: boolean (default: true)
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Hierarchy:**
```
Category (parent)
└── Subcategory (child, parentId set)
    └── Sub-subcategory (grandchild)
```

---

#### 10. Brands Table
```sql
Table: brands
Primary Key: id (UUID)
Indexes: slug
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  name: string (unique)
  slug: string (unique)
  description: string?
  logo: string?
  website: string?
  isActive: boolean (default: true)
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

#### 11. Departments Table
```sql
Table: departments
Primary Key: id (UUID)
```

**Fields:**
```typescript
{
  id: string (UUID, PK)
  name: string (unique)
  slug: string (unique)
  description: string?
  displayOrder: int
  isActive: boolean (default: true)
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (DEV ONLY)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed

# Validate schema
npx prisma validate

# Format schema
npx prisma format
```

---

## Inventory Database (inventory_db)

### Connection String

```bash
postgresql://postgres:postgres@localhost:5432/inventory_db
```

### Schema Overview

**File:** `backend/database_schema.sql`

#### Entity Relationship

```
Countries ────┐
Brands ────────┼── Products ──┬── ProductDimensions
Designers ─────┤              ├── ProductPackaging
Categories ────┘              ├── ProductPricing
Subcategories                 ├── ProductImages
                              └── ProductSpecifications
                              
Products ←──── InventoryTransactions
```

---

### Tables & Structure

#### 1. Countries (Master Table)
```sql
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(3) UNIQUE NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Data:** 10 countries
- CHN (China)
- DNK (Denmark)
- DEU (Germany)
- PRT (Portugal)
- ITA (Italy)
- FRA (France)
- JPN (Japan)
- GBR (United Kingdom)
- USA (United States)
- TWN (Taiwan)

**Query:**
```sql
SELECT * FROM countries ORDER BY country_name;
```

---

#### 2. Brands (Master Table)
```sql
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Data:** 4 brands
- Eva Solo (554 products)
- Eva Trio (231 products)
- PWtbS (18 products)
- Eva (1 product)

---

#### 3. Designers (Master Table)
```sql
CREATE TABLE designers (
    id SERIAL PRIMARY KEY,
    designer_name VARCHAR(100) UNIQUE NOT NULL,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Data:** 6 designers

---

#### 4. Categories (Master Table)
```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Data:** 3 categories
- **Tea & Coffee** (ID: 1, 252 products)
- **Table** (ID: 2, 288 products)
- **Glass & Stemware** (ID: 3, 265 products)

---

#### 5. Subcategories (Master Table)
```sql
CREATE TABLE subcategories (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    subcategory_name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, subcategory_name)
);
```

**Data:** 0 subcategories (currently not populated)

---

#### 6. Products (Core Table)
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    sku_2025 VARCHAR(50),
    sku_2026 VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_english VARCHAR(255),
    description TEXT,
    material VARCHAR(255),
    colour VARCHAR(100),
    size VARCHAR(100),
    ean VARCHAR(50),
    customs_tariff_number VARCHAR(50),
    dishwasher_safe BOOLEAN,
    cleaning_maintenance TEXT,
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    brand_id INTEGER REFERENCES brands(id),
    designer_id INTEGER REFERENCES designers(id),
    country_id INTEGER REFERENCES countries(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_ean ON products(ean);
```

**Data:** 805 products

**Sample Product:**
```sql
SELECT * FROM products WHERE sku = '115030';

Result:
- id: 806
- sku: 115030
- name: Serving fork 11 cm 3 pcs.
- category: Tea & Coffee
- brand: Eva Trio
- country: CHN (China)
- price: 145.00 AED
```

---

#### 7. ProductDimensions Table
```sql
CREATE TABLE product_dimensions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    functional_width_cm DECIMAL(10,2),
    functional_depth_cm DECIMAL(10,2),
    functional_height_cm DECIMAL(10,2),
    functional_diameter_cm DECIMAL(10,2),
    functional_capacity_liter DECIMAL(10,3),
    packed_width_cm DECIMAL(10,2),
    packed_depth_cm DECIMAL(10,2),
    packed_height_cm DECIMAL(10,2),
    packed_weight_kg DECIMAL(10,3),
    product_weight_kg DECIMAL(10,3),
    technical_capacity_liter DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 8. ProductPackaging Table
```sql
CREATE TABLE product_packaging (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    packaging_type VARCHAR(50),
    colli_size INTEGER,
    colli_weight_kg DECIMAL(10,3),
    colli_length_cm DECIMAL(10,2),
    colli_width_cm DECIMAL(10,2),
    colli_height_cm DECIMAL(10,2),
    master_colli_weight_kg DECIMAL(10,3),
    master_colli_length_cm DECIMAL(10,2),
    master_colli_width_cm DECIMAL(10,2),
    master_colli_height_cm DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Packaging Types:**
- Box
- Hangtag
- Gift box
- Carton

---

#### 9. ProductPricing Table
```sql
CREATE TABLE product_pricing (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rrp_aed_excl_vat DECIMAL(10,2),
    price_incl_vat DECIMAL(10,2),
    listed_price_incl_vat DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'AED',
    is_current BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Price Structure:**
- **RRP AED Excl VAT**: Recommended retail price without tax
- **Price Incl VAT**: Price with 5% VAT included
- **Listed Price Incl VAT**: Final listed price (may include discounts)

---

#### 10. ProductImages Table
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'product',
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### 11. ProductSpecifications Table
```sql
CREATE TABLE product_specifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    specification_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Example JSONB:**
```json
{
  "material": "Stainless steel",
  "dishwasher_safe": true,
  "microwave_safe": false,
  "warranty": "2 years",
  "care_instructions": "Hand wash recommended"
}
```

---

#### 12. InventoryTransactions Table
```sql
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Transaction Types:**
- `PURCHASE`: Stock received
- `SALE`: Item sold
- `RETURN`: Customer return
- `ADJUSTMENT`: Manual correction
- `DAMAGE`: Damaged goods
- `TRANSFER`: Warehouse transfer

---

### Views

#### 1. vw_products_complete
**Purpose:** Complete product information with all joins

```sql
CREATE VIEW vw_products_complete AS
SELECT 
    p.id,
    p.sku,
    p.sku_2025,
    p.sku_2026,
    p.name,
    p.name_english,
    p.description,
    p.material,
    p.colour,
    p.size,
    p.ean,
    p.customs_tariff_number,
    p.dishwasher_safe,
    p.cleaning_maintenance,
    p.is_active,
    c.category_name,
    sc.subcategory_name,
    b.brand_name,
    d.designer_name,
    co.country_name,
    pd.functional_width_cm,
    pd.functional_depth_cm,
    pd.functional_height_cm,
    pd.functional_diameter_cm,
    pd.functional_capacity_liter,
    pd.product_weight_kg,
    pd.packed_weight_kg,
    pp.packaging_type,
    pp.colli_size,
    pp.colli_weight_kg,
    ppr.rrp_aed_excl_vat,
    ppr.price_incl_vat,
    ppr.listed_price_incl_vat,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN designers d ON p.designer_id = d.id
LEFT JOIN countries co ON p.country_id = co.id
LEFT JOIN product_dimensions pd ON p.id = pd.product_id
LEFT JOIN product_packaging pp ON p.id = pp.product_id
LEFT JOIN product_pricing ppr ON p.id = ppr.product_id AND ppr.is_current = TRUE;
```

**Usage:**
```sql
SELECT * FROM vw_products_complete 
WHERE category_name = 'Tea & Coffee' 
LIMIT 10;
```

---

#### 2. vw_current_inventory
**Purpose:** Current stock levels per product

```sql
CREATE VIEW vw_current_inventory AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    COALESCE(SUM(CASE 
        WHEN it.transaction_type IN ('PURCHASE', 'RETURN') THEN it.quantity
        WHEN it.transaction_type IN ('SALE', 'DAMAGE') THEN -it.quantity
        ELSE it.quantity
    END), 0) AS current_stock,
    MAX(it.transaction_date) AS last_transaction_date
FROM products p
LEFT JOIN inventory_transactions it ON p.id = it.product_id
GROUP BY p.id, p.sku, p.name;
```

**Usage:**
```sql
SELECT * FROM vw_current_inventory 
WHERE current_stock < 10 
ORDER BY current_stock ASC;
```

---

### Auto-Update Triggers

All tables have automatic `updated_at` timestamp triggers:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Database Connections

### Node.js / NestJS Connection

**Using Prisma:**
```typescript
// backend/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

**Using Direct SQL (pg):**
```typescript
import { Pool } from 'pg';

const inventoryPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'inventory_db',
  user: 'postgres',
  password: 'postgres',
});

const result = await inventoryPool.query(
  'SELECT * FROM vw_products_complete WHERE category_name = $1 LIMIT 10',
  ['Tea & Coffee']
);
```

---

### Python Connection

```python
import psycopg2

# Connect to inventory database
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="inventory_db",
    user="postgres",
    password="postgres"
)

cursor = conn.cursor()
cursor.execute("SELECT * FROM products LIMIT 10")
products = cursor.fetchall()

conn.close()
```

---

### psql CLI

```bash
# Connect to application database
psql -U postgres -d postgres

# Connect to inventory database
psql -U postgres -d inventory_db

# Execute query from file
psql -U postgres -d inventory_db -f database_schema.sql

# Execute single query
psql -U postgres -d inventory_db -c "SELECT COUNT(*) FROM products"

# Export query results to CSV
psql -U postgres -d inventory_db -c "COPY (SELECT * FROM products) TO '/tmp/products.csv' CSV HEADER"
```

---

## Common Queries

### Application Database

**Get user with orders:**
```sql
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;
```

**Get active carts with items:**
```sql
SELECT 
    c.id,
    c.user_id,
    COUNT(ci.id) as item_count,
    SUM(ci.price * ci.quantity) as cart_total
FROM carts c
INNER JOIN cart_items ci ON c.id = ci.cart_id
GROUP BY c.id, c.user_id;
```

**Popular products:**
```sql
SELECT 
    p.name,
    p.sku,
    COUNT(oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity_sold
FROM products p
INNER JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.sku
ORDER BY times_ordered DESC
LIMIT 10;
```

---

### Inventory Database

**Products by category:**
```sql
SELECT 
    c.category_name,
    COUNT(p.id) as product_count,
    AVG(pp.rrp_aed_excl_vat) as avg_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN product_pricing pp ON p.id = pp.product_id AND pp.is_current = TRUE
GROUP BY c.id, c.category_name
ORDER BY c.display_order;
```

**Brand performance:**
```sql
SELECT 
    b.brand_name,
    COUNT(p.id) as product_count,
    MIN(pp.rrp_aed_excl_vat) as min_price,
    MAX(pp.rrp_aed_excl_vat) as max_price,
    AVG(pp.rrp_aed_excl_vat) as avg_price
FROM brands b
INNER JOIN products p ON b.id = p.brand_id
INNER JOIN product_pricing pp ON p.id = pp.product_id AND pp.is_current = TRUE
GROUP BY b.id, b.brand_name
ORDER BY product_count DESC;
```

**Price range distribution:**
```sql
SELECT 
    CASE 
        WHEN rrp_aed_excl_vat < 100 THEN '0-100'
        WHEN rrp_aed_excl_vat < 200 THEN '100-200'
        WHEN rrp_aed_excl_vat < 500 THEN '200-500'
        ELSE '500+'
    END as price_range,
    COUNT(*) as product_count
FROM product_pricing
WHERE is_current = TRUE
GROUP BY price_range
ORDER BY price_range;
```

**Search products:**
```sql
SELECT * FROM vw_products_complete
WHERE 
    (name ILIKE '%teapot%' OR description ILIKE '%teapot%')
    AND is_active = TRUE
ORDER BY name
LIMIT 20;
```

---

## Backup & Maintenance

### Backup Commands

**Full database backup:**
```bash
# Application database
pg_dump -U postgres -d postgres -F c -f app_backup_20251227.dump

# Inventory database
pg_dump -U postgres -d inventory_db -F c -f inventory_backup_20251227.dump

# Backup as SQL file
pg_dump -U postgres -d inventory_db > inventory_backup_20251227.sql
```

**Restore from backup:**
```bash
# Restore custom format
pg_restore -U postgres -d inventory_db -c inventory_backup_20251227.dump

# Restore SQL file
psql -U postgres -d inventory_db < inventory_backup_20251227.sql
```

---

### Maintenance Tasks

**Vacuum and analyze:**
```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE;

-- For specific table
VACUUM ANALYZE products;
```

**Reindex:**
```sql
-- Rebuild all indexes
REINDEX DATABASE inventory_db;

-- For specific table
REINDEX TABLE products;
```

**Check database size:**
```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname IN ('postgres', 'inventory_db');
```

**Check table sizes:**
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**Document:** DATABASE_COMPLETE_DOCUMENTATION.md  
**Generated:** December 27, 2025  
**Database System:** PostgreSQL 14+, Dual-database architecture

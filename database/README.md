# Database Setup

This folder contains PostgreSQL database dumps for the Solo E-commerce application.

## Databases

1. **solo_ecommerce.sql** - Main application database
   - User authentication and accounts
   - Orders and cart
   - CMS content (banners, pages)
   - Promotions

2. **inventory_db.sql** - Inventory/Product database
   - Products catalog (800+ products)
   - Categories (3 categories)
   - Brands (4+ brands)
   - Subcategories
   - Product pricing, dimensions, packaging, specifications
   - Product images

## How to Restore

### Prerequisites
- PostgreSQL 14 or higher installed
- psql command available in PATH

### Steps

1. Create the databases:
```sql
CREATE DATABASE solo_ecommerce;
CREATE DATABASE inventory_db;
```

2. Restore solo_ecommerce:
```bash
psql -U postgres -d solo_ecommerce -f database/solo_ecommerce.sql
```

3. Restore inventory_db:
```bash
psql -U postgres -d inventory_db -f database/inventory_db.sql
```

### Environment Variables

Create a `.env` file in the `backend` folder with:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/solo_ecommerce?schema=public"
INVENTORY_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="7d"
PORT=3000
NODE_ENV=development
```

## Default Admin Credentials

- Email: `aiman@solo-ecommerce.com`
- Password: `Admin123`

OR

- Email: `admin@solo-ecommerce.com`
- Password: `AdminPassword123!`

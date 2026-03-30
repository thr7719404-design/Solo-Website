# Inventory Database Import System

## Overview

This system provides a comprehensive PostgreSQL database schema for inventory management and tools to import data from Excel files. The database is designed with proper normalization, data integrity constraints, and optimized for inventory operations.

## Database Design

### Architecture

The database follows a **star schema** approach with normalized master tables and fact tables for transactional data:

#### Master Tables (Dimensions)
- **countries**: Country of origin master data
- **brands**: Product brand information
- **designers**: Designer information
- **categories**: Main product categories
- **subcategories**: Sub-categories linked to main categories

#### Core Product Table
- **products**: Central product master data with foreign keys to all master tables

#### Product Detail Tables (Facts)
- **product_dimensions**: Physical dimensions and capacities
- **product_packaging**: Packaging specifications and colli information
- **product_pricing**: Price history with effective date ranges
- **product_images**: Product image URLs
- **product_specifications**: Flexible key-value attributes

#### Operational Tables
- **inventory_transactions**: Complete transaction history for inventory tracking

### Key Features

1. **Data Integrity**
   - Foreign key constraints ensure referential integrity
   - Check constraints for valid data ranges
   - Unique constraints prevent duplicates

2. **Audit Trail**
   - `created_at` and `updated_at` timestamps on all tables
   - Automatic timestamp updates via triggers
   - Transaction history in inventory_transactions

3. **Flexibility**
   - Soft deletes with `is_active` flags
   - Historical pricing with effective date ranges
   - Flexible specifications table for additional attributes

4. **Performance**
   - Comprehensive indexing strategy
   - Optimized views for common queries
   - Partitioning-ready design for large datasets

## Installation Steps

### 1. Prerequisites

Ensure you have the following installed:
- PostgreSQL 12 or higher
- Python 3.8 or higher
- pip (Python package manager)

### 2. Install Required Python Packages

```powershell
pip install pandas openpyxl psycopg2-binary
```

### 3. Create Database

Connect to PostgreSQL and create the database:

```sql
CREATE DATABASE inventory_db;
```

Or using psql command line:

```powershell
psql -U postgres -c "CREATE DATABASE inventory_db;"
```

### 4. Run Database Schema

Execute the schema SQL file to create all tables:

```powershell
# Using psql
psql -U postgres -d inventory_db -f database_schema.sql

# Or using PowerShell with connection string
$env:PGPASSWORD = "your_password"
psql -h localhost -U postgres -d inventory_db -f database_schema.sql
```

### 5. Configure Import Script

Edit `import_excel_to_db.py` and update the database configuration:

```python
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'inventory_db',
    'user': 'postgres',           # Your PostgreSQL username
    'password': 'your_password'   # Your PostgreSQL password
}
```

### 6. Run Import

Execute the import script:

```powershell
python import_excel_to_db.py
```

## Database Schema Details

### Products Table Structure

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    brand_id INTEGER,
    -- ... more fields
)
```

### Pricing Strategy

The pricing table supports:
- Historical pricing with effective date ranges
- Multiple currencies
- VAT calculations
- Current price tracking with `is_current` flag

### Inventory Tracking

The `inventory_transactions` table tracks:
- PURCHASE: Incoming stock
- SALE: Outgoing stock
- ADJUSTMENT: Manual adjustments
- RETURN: Customer returns

Current stock is calculated using the view `vw_current_inventory`.

## Usage Examples

### Query Product Information

```sql
-- Get all products with complete information
SELECT * FROM vw_products_complete 
WHERE is_active = TRUE;

-- Products by category
SELECT category_name, COUNT(*) as product_count
FROM vw_products_complete
GROUP BY category_name;

-- Products with pricing
SELECT sku, name, brand_name, price_incl_vat
FROM vw_products_complete
WHERE price_incl_vat IS NOT NULL
ORDER BY price_incl_vat DESC;
```

### Check Inventory Levels

```sql
-- Current stock levels
SELECT * FROM vw_current_inventory
WHERE current_stock > 0;

-- Low stock alert (assuming reorder level is 10)
SELECT * FROM vw_current_inventory
WHERE current_stock < 10 AND current_stock > 0;

-- Out of stock items
SELECT * FROM vw_current_inventory
WHERE current_stock <= 0;
```

### Add Inventory Transaction

```sql
-- Record a purchase
INSERT INTO inventory_transactions (
    product_id, transaction_type, quantity, unit_cost,
    reference_number, reference_type, location, notes
)
VALUES (
    1, 'PURCHASE', 100, 50.00,
    'PO-2025-001', 'PO', 'Main Warehouse', 'Initial stock'
);

-- Record a sale
INSERT INTO inventory_transactions (
    product_id, transaction_type, quantity, unit_cost,
    reference_number, reference_type, location
)
VALUES (
    1, 'SALE', 5, 75.00,
    'SO-2025-001', 'SO', 'Main Warehouse'
);
```

### Update Product Pricing

```sql
-- Mark old price as inactive
UPDATE product_pricing
SET is_current = FALSE, effective_to = CURRENT_DATE
WHERE product_id = 1 AND is_current = TRUE;

-- Insert new price
INSERT INTO product_pricing (
    product_id, rrp_aed_excl_vat, price_incl_vat, 
    listed_price_incl_vat, is_current, effective_from
)
VALUES (
    1, 100.00, 105.00, 105.00, TRUE, CURRENT_DATE
);
```

## Database Maintenance

### Backup

```powershell
# Full backup
pg_dump -U postgres -d inventory_db -F c -f inventory_backup.dump

# Schema only
pg_dump -U postgres -d inventory_db --schema-only -f inventory_schema.sql

# Data only
pg_dump -U postgres -d inventory_db --data-only -f inventory_data.sql
```

### Restore

```powershell
# Restore from custom format
pg_restore -U postgres -d inventory_db -F c inventory_backup.dump

# Restore from SQL file
psql -U postgres -d inventory_db -f inventory_backup.sql
```

### Performance Tuning

```sql
-- Analyze tables for query optimization
ANALYZE products;
ANALYZE product_pricing;
ANALYZE inventory_transactions;

-- Reindex if needed
REINDEX TABLE products;

-- Vacuum to reclaim space
VACUUM ANALYZE products;
```

## API Integration

The database is designed to work seamlessly with the existing NestJS backend. Update your Prisma schema to match this structure:

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  sku         String   @unique
  name        String
  description String?
  categoryId  Int      @map("category_id")
  brandId     Int?     @map("brand_id")
  // ... more fields
  
  category    Category @relation(fields: [categoryId], references: [id])
  brand       Brand?   @relation(fields: [brandId], references: [id])
  
  @@map("products")
}
```

## Troubleshooting

### Import Errors

**Problem**: "ModuleNotFoundError: No module named 'pandas'"
```powershell
Solution: pip install pandas openpyxl psycopg2-binary
```

**Problem**: "psycopg2.OperationalError: could not connect to server"
```powershell
Solution:
1. Ensure PostgreSQL is running
2. Check DB_CONFIG credentials
3. Verify PostgreSQL is accepting connections on port 5432
```

**Problem**: "permission denied for table products"
```powershell
Solution: Grant permissions to your user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
```

### Data Issues

**Problem**: Duplicate SKU errors
```sql
Solution: Check for duplicates before import
SELECT sku, COUNT(*) 
FROM products 
GROUP BY sku 
HAVING COUNT(*) > 1;
```

## Future Enhancements

1. **Warehouse Management**
   - Add warehouse/location tables
   - Multi-location inventory tracking
   - Transfer transactions between locations

2. **Supplier Management**
   - Supplier master table
   - Purchase order tracking
   - Supplier pricing

3. **Customer Orders**
   - Customer table
   - Order header and line items
   - Order fulfillment tracking

4. **Barcode/QR Support**
   - Generate barcodes from SKU
   - QR code for product details

5. **Reporting**
   - Sales analytics
   - Inventory valuation
   - Slow-moving stock reports

## Contact & Support

For questions or issues, refer to the project documentation or contact the development team.

## License

This database schema and import tools are proprietary to the organization.

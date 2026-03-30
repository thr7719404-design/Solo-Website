# Quick Start Guide - Inventory Database

## 🚀 Quick Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

```powershell
cd c:\Users\thr49\Test-website\backend
.\setup-database-complete.ps1
```

Follow the wizard prompts. Done! ✅

### Option 2: Manual Setup

```powershell
# 1. Install dependencies
pip install pandas openpyxl psycopg2-binary

# 2. Create database
psql -U postgres -c "CREATE DATABASE inventory_db;"

# 3. Run schema
psql -U postgres -d inventory_db -f database_schema.sql

# 4. Import data
python import_excel_to_db.py
```

## 📊 Quick Queries

### View All Products
```sql
SELECT * FROM vw_products_complete 
WHERE is_active = TRUE
LIMIT 10;
```

### Check Stock Levels
```sql
SELECT * FROM vw_current_inventory
ORDER BY current_stock DESC;
```

### Products by Category
```sql
SELECT category_name, COUNT(*) as count, 
       AVG(price_incl_vat) as avg_price
FROM vw_products_complete
GROUP BY category_name;
```

### Search Products
```sql
SELECT sku, name, brand_name, price_incl_vat
FROM vw_products_complete
WHERE name ILIKE '%coffee%'
   OR description ILIKE '%coffee%';
```

## 🔧 Common Operations

### Add New Product
```sql
INSERT INTO products (sku, name, category_id, brand_id, is_active)
VALUES ('NEW001', 'New Product', 1, 1, TRUE);
```

### Update Price
```sql
-- Deactivate old price
UPDATE product_pricing SET is_current = FALSE 
WHERE product_id = 1 AND is_current = TRUE;

-- Add new price
INSERT INTO product_pricing (product_id, rrp_aed_excl_vat, price_incl_vat, is_current)
VALUES (1, 100.00, 105.00, TRUE);
```

### Record Stock Transaction
```sql
-- Receive stock
INSERT INTO inventory_transactions 
(product_id, transaction_type, quantity, unit_cost, reference_number)
VALUES (1, 'PURCHASE', 100, 50.00, 'PO-001');

-- Record sale
INSERT INTO inventory_transactions 
(product_id, transaction_type, quantity, reference_number)
VALUES (1, 'SALE', 5, 'SO-001');
```

## 📁 File Reference

| File | Purpose |
|------|---------|
| `database_schema.sql` | Complete database schema |
| `import_excel_to_db.py` | Data import script |
| `setup-database-complete.ps1` | Automated setup wizard |
| `DATABASE_README.md` | Full documentation |
| `DATABASE_DIAGRAM.md` | Visual schema diagram |

## 🔗 Database Connection

```
Host: localhost
Port: 5432
Database: inventory_db
User: postgres
Password: postgres

Connection String:
postgresql://postgres:postgres@localhost:5432/inventory_db
```

## 📋 Table Quick Reference

### Master Tables
- `countries` - Countries of origin
- `brands` - Product brands
- `designers` - Product designers
- `categories` - Main categories (Tea & Coffee, Table, Glass & Stemware)
- `subcategories` - Sub-categories linked to categories

### Core Table
- `products` - Main product data (805 rows)

### Detail Tables
- `product_dimensions` - Size, weight, capacity
- `product_packaging` - Colli specifications
- `product_pricing` - Prices with history
- `product_images` - Image URLs
- `product_specifications` - Additional attributes

### Operational Tables
- `inventory_transactions` - Stock movements

### Views
- `vw_products_complete` - Full product info
- `vw_current_inventory` - Stock levels

## 🎯 Common Tasks

### Find Low Stock
```sql
SELECT * FROM vw_current_inventory 
WHERE current_stock < 10 AND current_stock > 0;
```

### Top 10 Expensive Products
```sql
SELECT sku, name, brand_name, price_incl_vat
FROM vw_products_complete
ORDER BY price_incl_vat DESC NULLS LAST
LIMIT 10;
```

### Products Without Prices
```sql
SELECT sku, name, category_name
FROM vw_products_complete
WHERE price_incl_vat IS NULL;
```

### Stock Value
```sql
SELECT 
    p.sku,
    p.name,
    i.current_stock,
    pp.price_incl_vat,
    (i.current_stock * pp.price_incl_vat) as stock_value
FROM vw_current_inventory i
JOIN products p ON i.product_id = p.id
JOIN product_pricing pp ON p.id = pp.product_id AND pp.is_current = TRUE
WHERE i.current_stock > 0
ORDER BY stock_value DESC;
```

### Sales Report (Last 30 Days)
```sql
SELECT 
    p.name,
    COUNT(*) as transaction_count,
    SUM(it.quantity) as total_quantity,
    SUM(it.total_cost) as total_value
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
WHERE it.transaction_type = 'SALE'
  AND it.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.name
ORDER BY total_value DESC
LIMIT 20;
```

## 🔍 Troubleshooting

### Can't connect to database
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start service if stopped
Start-Service postgresql-x64-14  # Adjust version
```

### Import script fails
```powershell
# Check Python packages
pip list | findstr "pandas\|openpyxl\|psycopg2"

# Reinstall if needed
pip install --upgrade pandas openpyxl psycopg2-binary
```

### Permission denied
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

## 📞 Support

- Full Documentation: `DATABASE_README.md`
- Schema Diagram: `DATABASE_DIAGRAM.md`
- Excel Analysis: `analyze_excel.py`

## ⚡ Quick Commands

```powershell
# Connect to database
psql -U postgres -d inventory_db

# Backup database
pg_dump -U postgres -Fc inventory_db > backup.dump

# Restore database
pg_restore -U postgres -d inventory_db backup.dump

# Check table sizes
psql -U postgres -d inventory_db -c "\dt+"

# View table structure
psql -U postgres -d inventory_db -c "\d products"
```

## 🎓 Learning Path

1. ✅ Run setup script
2. ✅ View data using simple SELECT queries
3. ✅ Try INSERT/UPDATE operations
4. ✅ Practice with inventory transactions
5. ✅ Create custom reports
6. ✅ Integrate with NestJS backend

## 🚨 Important Notes

- Always backup before major changes
- Use transactions for multiple operations
- Keep pricing history with effective dates
- Track all inventory movements
- Regular VACUUM and ANALYZE for performance

---

**Ready to start?** Run the setup script now:

```powershell
.\setup-database-complete.ps1
```

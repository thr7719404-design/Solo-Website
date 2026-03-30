"""
Excel to PostgreSQL Data Import Script
This script reads the Excel file and imports data into the PostgreSQL database
with proper normalization and data integrity checks.
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
import sys
from decimal import Decimal
import re

# Database connection configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'inventory_db',  # Change this to your database name
    'user': 'postgres',          # Change this to your username
    'password': 'postgres'       # Change this to your password
}

EXCEL_FILE = r'C:\Users\thr49\Downloads\Data Sheet with UAE Prices 2025 2026  Sent to Aiment and Tarek 21.12.2025 (2).xlsx'

def get_db_connection():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def clean_value(value):
    """Clean and convert values"""
    if pd.isna(value) or value == '' or value == 'NaN':
        return None
    if isinstance(value, str):
        value = value.strip()
        if value.lower() in ['nan', 'none', '']:
            return None
    return value

def safe_int(value):
    """Safely convert to integer"""
    value = clean_value(value)
    if value is None:
        return None
    try:
        return int(float(value))
    except:
        return None

def safe_float(value):
    """Safely convert to float"""
    value = clean_value(value)
    if value is None:
        return None
    try:
        return float(value)
    except:
        return None

def safe_bool(value):
    """Safely convert to boolean"""
    value = clean_value(value)
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ['yes', 'true', '1', 'y']
    return bool(value)

def import_master_data(conn, df):
    """Import master data tables"""
    cursor = conn.cursor()
    
    print("Importing master data...")
    
    # 1. Import Countries
    print("  - Countries...")
    countries = df['Country of origin'].dropna().unique()
    country_map = {}
    for country in countries:
        country = clean_value(country)
        if country:
            cursor.execute("""
                INSERT INTO countries (country_code, country_name)
                VALUES (%s, %s)
                ON CONFLICT (country_code) DO UPDATE SET country_name = EXCLUDED.country_name
                RETURNING id
            """, (country[:3].upper(), country))
            country_map[country] = cursor.fetchone()[0]
    
    conn.commit()
    print(f"    Inserted {len(country_map)} countries")
    
    # 2. Import Brands
    print("  - Brands...")
    brands = df['Brand'].dropna().unique()
    brand_map = {}
    for brand in brands:
        brand = clean_value(brand)
        if brand:
            cursor.execute("""
                INSERT INTO brands (brand_name)
                VALUES (%s)
                ON CONFLICT (brand_name) DO UPDATE SET brand_name = EXCLUDED.brand_name
                RETURNING id
            """, (brand,))
            brand_map[brand] = cursor.fetchone()[0]
    
    conn.commit()
    print(f"    Inserted {len(brand_map)} brands")
    
    # 3. Import Designers
    print("  - Designers...")
    designers = df['Designer'].dropna().unique()
    designer_map = {}
    for designer in designers:
        designer = clean_value(designer)
        if designer:
            cursor.execute("""
                INSERT INTO designers (designer_name)
                VALUES (%s)
                ON CONFLICT (designer_name) DO UPDATE SET designer_name = EXCLUDED.designer_name
                RETURNING id
            """, (designer,))
            designer_map[designer] = cursor.fetchone()[0]
    
    conn.commit()
    print(f"    Inserted {len(designer_map)} designers")
    
    # 4. Categories are already inserted in schema
    cursor.execute("SELECT id, category_name FROM categories")
    category_map = {row[1]: row[0] for row in cursor.fetchall()}
    print(f"    Found {len(category_map)} categories")
    
    cursor.close()
    
    return {
        'countries': country_map,
        'brands': brand_map,
        'designers': designer_map,
        'categories': category_map
    }

def import_products(conn, df, master_data):
    """Import products and related data"""
    cursor = conn.cursor()
    
    print("\nImporting products...")
    
    successful = 0
    failed = 0
    
    for idx, row in df.iterrows():
        try:
            # Get master data IDs
            category_id = master_data['categories'].get(clean_value(row['Category Name']))
            if not category_id:
                print(f"  Warning: No category found for row {idx}, skipping...")
                failed += 1
                continue
            
            country_name = clean_value(row['Country of origin'])
            country_id = master_data['countries'].get(country_name) if country_name else None
            
            brand_name = clean_value(row['Brand'])
            brand_id = master_data['brands'].get(brand_name) if brand_name else None
            
            designer_name = clean_value(row['Designer'])
            designer_id = master_data['designers'].get(designer_name) if designer_name else None
            
            # Insert product
            cursor.execute("""
                INSERT INTO products (
                    sku, sku_2025, sku_2026, name, name_english, description,
                    category_id, subcategory_id, brand_id, designer_id, country_id,
                    material, colour, size, ean, ean_secondary, customs_tariff_number,
                    dishwasher_safe, cleaning_maintenance, is_active
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING id
            """, (
                str(row['SKU']),
                safe_int(row['SKU 2025']),
                safe_int(row['SKU 2026']),
                clean_value(row['Name']),
                clean_value(row['Name English']),
                clean_value(row['Description']),
                category_id,
                None,  # subcategory_id - not in current data
                brand_id,
                designer_id,
                country_id,
                clean_value(row['Material']),
                clean_value(row['Colour']),
                clean_value(row['Size']),
                safe_int(row['EAN']),
                safe_int(row['EAN.1']),
                safe_int(row['Customs tariff number']),
                safe_bool(row['Dishwasher safe']),
                clean_value(row['Cleaning and maintenance']),
                True
            ))
            
            product_id = cursor.fetchone()[0]
            
            # Insert product dimensions
            cursor.execute("""
                INSERT INTO product_dimensions (
                    product_id, functional_depth_cm, functional_width_cm, functional_height_cm,
                    functional_diameter_cm, functional_capacity_liter, packed_weight_kg,
                    packed_depth_cm, packed_width_cm, packed_height_cm,
                    product_weight_kg, technical_capacity_liter
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                product_id,
                safe_float(row['Functional product depth (cm)']),
                safe_float(row['Functional product width (cm)']),
                safe_float(row['Functional product height (cm)']),
                safe_float(row['Functional product diameter (cm)']),
                safe_float(row['Functional product capacity (liter)']),
                safe_float(row['Packed product weight (kg)']),
                safe_float(row['Packed product depth (cm)']),
                safe_float(row['Packed product width (cm)']),
                safe_float(row['Packed product height (cm)']),
                safe_float(row['Product weight (kg)']),
                safe_float(row['Technical product capacity (Liter)'])
            ))
            
            # Insert product packaging
            cursor.execute("""
                INSERT INTO product_packaging (
                    product_id, packaging_type, colli_size, colli_weight_kg,
                    colli_length_cm, colli_width_cm, colli_height_cm,
                    master_colli_weight_kg, master_colli_length_cm,
                    master_colli_width_cm, master_colli_height_cm
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                product_id,
                clean_value(row['Packaging type']),
                safe_int(row['Colli Size']),
                safe_float(row['Colli weight (kg)']),
                safe_float(row['Colli length (cm)']),
                safe_float(row['Colli width (cm)']),
                safe_float(row['Colli height (cm)']),
                safe_float(row['Master colli weight (kg)']),
                safe_float(row['Master colli length (cm)']),
                safe_float(row['Master colli width (cm)']),
                safe_float(row['Master colli height (cm)'])
            ))
            
            # Insert product pricing
            cursor.execute("""
                INSERT INTO product_pricing (
                    product_id, rrp_aed_excl_vat, price_incl_vat,
                    listed_price_incl_vat, is_current
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                product_id,
                safe_float(row['RRP AED EXCL VAT']),
                safe_float(row['Incl VAT']),
                safe_float(row['PLEASE LIST BELOW PRICE INCL VAT']),
                True
            ))
            
            successful += 1
            
            # Commit every 100 records
            if successful % 100 == 0:
                conn.commit()
                print(f"  Processed {successful} products...")
        
        except Exception as e:
            print(f"  Error importing product {row['SKU']}: {e}")
            failed += 1
            conn.rollback()
            continue
    
    # Final commit
    conn.commit()
    cursor.close()
    
    print(f"\nImport complete!")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print(f"  Total: {successful + failed}")
    
    return successful, failed

def generate_summary_report(conn):
    """Generate summary report of imported data"""
    cursor = conn.cursor()
    
    print("\n" + "="*80)
    print("DATABASE IMPORT SUMMARY REPORT")
    print("="*80)
    
    # Count products by category
    cursor.execute("""
        SELECT c.category_name, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.category_name
        ORDER BY c.category_name
    """)
    
    print("\nProducts by Category:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} products")
    
    # Count by brand
    cursor.execute("""
        SELECT b.brand_name, COUNT(p.id) as product_count
        FROM brands b
        LEFT JOIN products p ON b.id = p.brand_id
        GROUP BY b.brand_name
        ORDER BY product_count DESC
        LIMIT 10
    """)
    
    print("\nTop 10 Brands by Product Count:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} products")
    
    # Total counts
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM brands")
    total_brands = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM countries")
    total_countries = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM designers")
    total_designers = cursor.fetchone()[0]
    
    print("\n" + "="*80)
    print("TOTALS:")
    print(f"  Products: {total_products}")
    print(f"  Brands: {total_brands}")
    print(f"  Countries: {total_countries}")
    print(f"  Designers: {total_designers}")
    print("="*80)
    
    cursor.close()

def main():
    """Main execution function"""
    print("="*80)
    print("EXCEL TO POSTGRESQL IMPORT TOOL")
    print("="*80)
    
    # Read Excel file
    print(f"\nReading Excel file: {EXCEL_FILE}")
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name=0)
        # Clean column names - strip whitespace
        df.columns = df.columns.str.strip()
        print(f"  Loaded {len(df)} rows")
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        sys.exit(1)
    
    # Connect to database
    print("\nConnecting to PostgreSQL database...")
    conn = get_db_connection()
    print("  Connected successfully")
    
    try:
        # Import master data
        master_data = import_master_data(conn, df)
        
        # Import products
        successful, failed = import_products(conn, df, master_data)
        
        # Generate report
        generate_summary_report(conn)
        
    except Exception as e:
        print(f"\nError during import: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()
        print("\nDatabase connection closed")

if __name__ == "__main__":
    main()

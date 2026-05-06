"""
Product loader: reads the Excel data sheet, maps to DB schema,
loads valid products, and exports incomplete ones to a separate Excel.
"""
import sys
import re
import unicodedata
import openpyxl
from openpyxl import Workbook
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

# ── Config ────────────────────────────────────────────────────────
EXCEL_PATH = r'C:\Users\user\Downloads\Data Sheet with UAE Prices 2025 2026  Sent to Aiment and Tarek 21.12.2025 1  rev 6 April 2026.xlsx'
NOT_LOADED_PATH = r'D:\Solo Website\scripts\not_loaded_products.xlsx'

DB_CONFIG = {
    'host': 'pg-qlyb5greec2io.postgres.database.azure.com',
    'port': 5432,
    'dbname': 'solo_ecommerce',
    'user': 'soloadmin',
    'password': os.environ.get('PGPASSWORD') or (_ for _ in ()).throw(SystemExit('PGPASSWORD env var is required.')),
    'sslmode': 'require',
}

VAT_RATE = 0.05

# ── Category mapping (keyword → category name) ────────────────────
# Order matters: first match wins, so more specific patterns go first
CATEGORY_RULES = [
    # Cookware
    (r'frying pan|saut[eé] pan|casserole|saucepan|sauce pan|wok|pot |stock pot|roasting|grill pan', 'Cookware'),
    # Cutlery (knives)
    (r'knife|knives|peeler|scissors|cutting board|knife stand', 'Cutlery'),
    # Kitchen Tools (utensils)
    (r'fork|spoon|spatula|tongs|ladle|whisk|brush|strainer|grater|garlic press|corkscrew|can opener|pizza cutter|timer|thermometer|scale|trivet|drying rack|colander|sieve|turner|skimmer|serving set|serving tool|nutcracker', 'Kitchen Tools'),
    # Drinkware
    (r'mug|cup|glass|tumbler|carafe|pitcher|bottle|flask|thermo|drinking|latte|espresso|coffee cup|tea cup', 'Drinkware'),
    # Small Appliances
    (r'kettle|blender|toaster|coffee maker|coffee press', 'Small Appliances'),
    # Food Storage
    (r'storage|container|lunch box|food box|jar|vacuum jug|jug|insulated', 'Food Storage'),
    # Bakeware
    (r'baking|cake|muffin|oven mitt|oven glove', 'Bakeware'),
    # Outdoor & Travel (bird feeders, lanterns, outdoor items)
    (r'bird|feeder|lantern|outdoor|picnic|grill(?! pan)|bbq|garden|fire', 'Outdoor & Travel'),
    # Kitchen / Serving (bowls, plates, dishes, trays)
    (r'bowl|plate|dish|tray|platter|serving', 'Kitchen Tools'),
    # Home (bins, soap dispensers, candle holders, vases, hooks, hangers)
    (r'bin|soap dispenser|candle|vase|hook|hanger|tissue|toilet|towel|dustpan|sweep|waste|trash|pedal|touch bin|table|hanging|rack|shelf|stand|holder|organiser|organizer', 'Food Storage'),
    # Lids & accessories
    (r'lid|cover', 'Cookware'),
]

def slugify(text):
    """Convert text to URL-friendly slug."""
    text = str(text).strip().lower()
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text).strip('-')
    return text[:255]

def assign_category(name):
    """Match product name to existing category."""
    name_lower = name.lower()
    for pattern, cat_name in CATEGORY_RULES:
        if re.search(pattern, name_lower):
            return cat_name
    return None

def read_excel():
    """Read and parse the Excel file, returning structured product data."""
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb['Export']
    
    # Build lookup for left-side data by SKU
    left_data = {}
    for r in range(2, ws.max_row + 1):
        sku = ws.cell(row=r, column=1).value
        if sku:
            left_data[str(sku)] = r
    
    products = []
    not_loaded = []
    skipped_delete = []
    
    # Track which left-side rows have been processed
    processed_left_rows = set()
    
    for r in range(2, ws.max_row + 1):
        sku_left = ws.cell(row=r, column=1).value
        sku_right = ws.cell(row=r, column=38).value
        comment = str(ws.cell(row=r, column=44).value or '').strip()
        comment_lower = comment.lower()
        
        # Skip empty rows
        if not sku_left and not sku_right:
            continue
        
        # Skip delete rows
        if 'delete' in comment_lower:
            sku = sku_left or sku_right
            name = ws.cell(row=r, column=2).value or ws.cell(row=r, column=39).value
            skipped_delete.append((r, str(sku), str(name or ''), comment))
            continue
        
        # Determine which SKU to use (prefer right-side as it's the 2026 version)
        sku_2026 = ws.cell(row=r, column=36).value  # AJ = SKU 2026
        sku = str(sku_right or sku_2026 or sku_left)
        
        # Skip #VALUE! errors
        if '#VALUE!' in sku or '#REF!' in sku:
            continue
        
        # Get price
        price = ws.cell(row=r, column=43).value  # AQ = RRP AED EXCL VAT
        
        # Skip no-price rows
        if price is None:
            name = ws.cell(row=r, column=2).value or ws.cell(row=r, column=39).value
            not_loaded.append({
                'row': r,
                'sku': sku,
                'name': str(name or ''),
                'reason': 'No price',
                'comment': comment,
            })
            continue
        
        # Determine if we have full left-side data
        has_left = sku_left is not None and ws.cell(row=r, column=3).value is not None
        
        # If right-side only, check if there's a matching left-side row
        detail_row = r
        if not has_left:
            if sku in left_data:
                detail_row = left_data[sku]
                has_left = ws.cell(row=detail_row, column=3).value is not None
        
        if not has_left:
            # Right-side only, no matching detail → not loadable
            name = ws.cell(row=r, column=39).value or ws.cell(row=r, column=2).value
            not_loaded.append({
                'row': r,
                'sku': sku,
                'name': str(name or ''),
                'price': price,
                'reason': 'Missing product details (description, material, brand, dimensions)',
                'comment': comment,
            })
            continue
        
        # ── Full data available, build product dict ──
        dr = detail_row  # row to read detail from
        name_en = ws.cell(row=r, column=39).value or ws.cell(row=dr, column=2).value
        
        product = {
            'sku': sku,
            'name': str(name_en).strip() if name_en else '',
            'description': str(ws.cell(row=dr, column=3).value or '').strip(),
            'material': str(ws.cell(row=dr, column=4).value or '').strip() or None,
            'cleaning': str(ws.cell(row=dr, column=5).value or '').strip() or None,
            'brand': str(ws.cell(row=dr, column=6).value or '').strip() or None,
            'packaging_type': str(ws.cell(row=dr, column=7).value or '').strip() or None,
            'colli_size': ws.cell(row=dr, column=8).value,
            'country_code': str(ws.cell(row=dr, column=9).value or '').strip() or None,
            'colour': str(ws.cell(row=dr, column=10).value or '').strip() or None,
            'designer': str(ws.cell(row=dr, column=11).value or '').strip() or None,
            'dishwasher_safe': str(ws.cell(row=dr, column=12).value or '').strip() or None,
            'ean': ws.cell(row=dr, column=13).value or ws.cell(row=r, column=40).value,
            'weight_kg': ws.cell(row=dr, column=15).value,
            'depth_cm': ws.cell(row=dr, column=16).value,
            'width_cm': ws.cell(row=dr, column=17).value,
            'height_cm': ws.cell(row=dr, column=18).value,
            'diameter_cm': ws.cell(row=dr, column=19).value,
            'capacity_liter': ws.cell(row=dr, column=20).value,
            'packed_weight_kg': ws.cell(row=dr, column=21).value,
            'packed_depth_cm': ws.cell(row=dr, column=22).value,
            'packed_width_cm': ws.cell(row=dr, column=23).value,
            'packed_height_cm': ws.cell(row=dr, column=24).value,
            'size': str(ws.cell(row=r, column=41).value or ws.cell(row=dr, column=26).value or '').strip() or None,
            'colli_weight_kg': ws.cell(row=dr, column=27).value,
            'price_excl_vat': float(price),
            'comment': comment,
        }
        
        # Skip products with brand 'PWtbS' - assign null brand
        if product['brand'] == 'PWtbS':
            product['brand'] = None
        
        products.append(product)
        if sku_left:
            processed_left_rows.add(r)
    
    print(f"Products to load: {len(products)}")
    print(f"Not loaded (incomplete): {len(not_loaded)}")
    print(f"Skipped (delete): {len(skipped_delete)}")
    
    return products, not_loaded, skipped_delete

def export_not_loaded(not_loaded):
    """Export incomplete products to Excel."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Not Loaded Products"
    
    headers = ['Row in Source', 'SKU', 'Name', 'Price (AED excl VAT)', 'Reason', 'Source Comment',
               'Description', 'Material', 'Brand', 'Colour', 'Country of Origin',
               'Designer', 'Size', 'Weight (kg)', 'Depth (cm)', 'Width (cm)', 'Height (cm)',
               'Diameter (cm)', 'Capacity (liter)', 'Category', 'Subcategory']
    ws.append(headers)
    
    # Bold headers
    for cell in ws[1]:
        cell.font = openpyxl.styles.Font(bold=True)
    
    for item in not_loaded:
        ws.append([
            item.get('row', ''),
            item.get('sku', ''),
            item.get('name', ''),
            item.get('price', ''),
            item.get('reason', ''),
            item.get('comment', ''),
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        ])
    
    # Auto-width
    for col in ws.columns:
        max_len = max(len(str(c.value or '')) for c in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 50)
    
    wb.save(NOT_LOADED_PATH)
    print(f"Exported {len(not_loaded)} not-loaded products to: {NOT_LOADED_PATH}")

def ensure_lookup_data(conn, products):
    """Ensure brands, designers, countries exist. Returns lookup dicts."""
    cur = conn.cursor()
    
    # ── Brands ──
    brand_names = set(p['brand'] for p in products if p['brand'])
    cur.execute("SELECT id, name FROM brands")
    brand_map = {row[1]: row[0] for row in cur.fetchall()}
    
    for bn in brand_names:
        if bn not in brand_map:
            slug = slugify(bn)
            cur.execute(
                "INSERT INTO brands (name, slug, is_active) VALUES (%s, %s, true) RETURNING id",
                (bn, slug)
            )
            brand_map[bn] = cur.fetchone()[0]
            print(f"  Created brand: {bn} (id={brand_map[bn]})")
    
    # ── Designers ──
    designer_names = set(p['designer'] for p in products if p['designer'])
    cur.execute("SELECT id, name FROM designers")
    designer_map = {row[1]: row[0] for row in cur.fetchall()}
    
    for dn in designer_names:
        if dn not in designer_map:
            slug = slugify(dn)
            cur.execute(
                "INSERT INTO designers (name, slug, is_active) VALUES (%s, %s, true) RETURNING id",
                (dn, slug)
            )
            designer_map[dn] = cur.fetchone()[0]
            print(f"  Created designer: {dn} (id={designer_map[dn]})")
    
    # ── Countries ──
    country_codes = set(p['country_code'] for p in products if p['country_code'])
    cur.execute("SELECT id, country_code FROM countries")
    country_map = {row[1]: row[0] for row in cur.fetchall()}
    
    COUNTRY_NAMES = {
        'CHN': 'China', 'DNK': 'Denmark', 'DEU': 'Germany', 'THA': 'Thailand',
        'IND': 'India', 'TWN': 'Taiwan', 'POL': 'Poland', 'CZE': 'Czech Republic',
        'VNM': 'Vietnam', 'USA': 'United States', 'GBR': 'United Kingdom',
        'JPN': 'Japan', 'KOR': 'South Korea', 'FRA': 'France', 'ITA': 'Italy',
        'ESP': 'Spain', 'PRT': 'Portugal', 'TUR': 'Turkey', 'ARE': 'UAE',
        'BRA': 'Brazil', 'MEX': 'Mexico', 'IDN': 'Indonesia', 'MYS': 'Malaysia',
    }
    
    for cc in country_codes:
        if cc not in country_map:
            cn = COUNTRY_NAMES.get(cc, cc)
            cur.execute(
                "INSERT INTO countries (country_code, country_name, is_active) VALUES (%s, %s, true) RETURNING id",
                (cc, cn)
            )
            country_map[cc] = cur.fetchone()[0]
            print(f"  Created country: {cc} = {cn} (id={country_map[cc]})")
    
    # ── Categories (use existing ones) ──
    cur.execute("SELECT id, name FROM categories")
    category_map = {row[1]: row[0] for row in cur.fetchall()}
    
    conn.commit()
    return brand_map, designer_map, country_map, category_map

def delete_existing_products(conn):
    """Delete all existing products and related data."""
    cur = conn.cursor()
    
    # Delete in order (children first)
    tables = [
        'product_specifications',
        'product_images',
        'product_pricing',
        'product_packaging',
        'product_dimensions',
        'stock_movements',
        'product_variants',
        'product_overrides',
        'products',
    ]
    
    for table in tables:
        cur.execute(f"DELETE FROM {table}")
        count = cur.rowcount
        if count > 0:
            print(f"  Deleted {count} rows from {table}")
    
    conn.commit()
    print("  Existing products cleared.")

def load_products(conn, products, brand_map, designer_map, country_map, category_map):
    """Insert products and related records."""
    cur = conn.cursor()
    
    loaded = 0
    errors = []
    seen_skus = set()
    total = len(products)
    
    for idx, p in enumerate(products, 1):
        sku = str(p['sku']).strip()
        
        # Skip duplicate SKUs
        if sku in seen_skus:
            continue
        seen_skus.add(sku)
        
        # Progress indicator
        if idx % 50 == 0 or idx == total:
            print(f"  Progress: {idx}/{total} ...", flush=True)
        
        try:
            cur.execute("SAVEPOINT sp")
            name = p['name']
            slug = slugify(f"{sku}-{name}")
            
            # Ensure unique slug
            cur.execute("SELECT COUNT(*) FROM products WHERE slug = %s", (slug,))
            if cur.fetchone()[0] > 0:
                slug = f"{slug}-{sku}"
            
            brand_id = brand_map.get(p['brand']) if p['brand'] else None
            designer_id = designer_map.get(p['designer']) if p['designer'] else None
            country_id = country_map.get(p['country_code']) if p['country_code'] else None
            
            # Auto-assign category
            cat_name = assign_category(name)
            category_id = category_map.get(cat_name) if cat_name else None
            
            # Build short description from material + cleaning
            short_desc_parts = []
            if p['material']:
                short_desc_parts.append(p['material'])
            if p['size']:
                short_desc_parts.append(p['size'])
            short_desc = ' | '.join(short_desc_parts) if short_desc_parts else None
            
            # Parse EAN
            ean = None
            if p['ean']:
                try:
                    ean = int(float(str(p['ean'])))
                except (ValueError, TypeError):
                    pass
            
            # ── Insert product ──
            cur.execute("""
                INSERT INTO products (
                    sku, name, slug, description, short_description,
                    category_id, brand_id, designer_id, country_id,
                    material, colour, size, ean,
                    is_active, is_discontinued, is_featured, is_new, is_best_seller,
                    stock_qty, reserved_qty, low_stock_alert,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    true, false, false, false, false,
                    0, 0, 5,
                    NOW(), NOW()
                ) RETURNING id
            """, (
                sku, name, slug, p['description'], short_desc,
                category_id, brand_id, designer_id, country_id,
                p['material'], p['colour'], p['size'], ean,
            ))
            product_id = cur.fetchone()[0]
            
            # ── Insert pricing ──
            price_excl = round(p['price_excl_vat'], 2)
            price_incl = round(price_excl * (1 + VAT_RATE), 2)
            
            cur.execute("""
                INSERT INTO product_pricing (
                    product_id, price_excl_vat_aed, price_incl_vat_aed,
                    vat_rate, is_current, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, true, NOW(), NOW())
            """, (product_id, price_excl, price_incl, VAT_RATE))
            
            # ── Insert dimensions ──
            has_dims = any([
                p['weight_kg'], p['depth_cm'], p['width_cm'], p['height_cm'],
                p['diameter_cm'], p['capacity_liter'],
                p['packed_weight_kg'], p['packed_depth_cm'], p['packed_width_cm'], p['packed_height_cm'],
            ])
            
            if has_dims:
                cur.execute("""
                    INSERT INTO product_dimensions (
                        product_id, weight_kg, length_cm, width_cm, height_cm,
                        diameter_cm, capacity_liter,
                        packed_weight_kg, packed_length_cm, packed_width_cm, packed_height_cm,
                        created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, (
                    product_id,
                    p['weight_kg'], p['depth_cm'], p['width_cm'], p['height_cm'],
                    p['diameter_cm'], p['capacity_liter'],
                    p['packed_weight_kg'], p['packed_depth_cm'], p['packed_width_cm'], p['packed_height_cm'],
                ))
            
            # ── Insert packaging ──
            if p['packaging_type'] or p['colli_size'] or p['colli_weight_kg']:
                colli_size = None
                if p['colli_size']:
                    try:
                        colli_size = int(float(str(p['colli_size'])))
                    except (ValueError, TypeError):
                        pass
                
                cur.execute("""
                    INSERT INTO product_packaging (
                        product_id, packaging_type, units_per_pack,
                        pack_weight_kg, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, NOW(), NOW())
                """, (product_id, p['packaging_type'], colli_size, p['colli_weight_kg']))
            
            # ── Insert specifications ──
            specs = []
            order = 0
            if p['material']:
                specs.append((product_id, 'Material', p['material'], None, order))
                order += 1
            if p['colour']:
                specs.append((product_id, 'Colour', p['colour'], None, order))
                order += 1
            if p['size']:
                specs.append((product_id, 'Size', p['size'], None, order))
                order += 1
            if p['dishwasher_safe']:
                specs.append((product_id, 'Dishwasher Safe', p['dishwasher_safe'], None, order))
                order += 1
            if p['cleaning']:
                specs.append((product_id, 'Cleaning & Maintenance', p['cleaning'], None, order))
                order += 1
            if p['country_code']:
                specs.append((product_id, 'Country of Origin', p['country_code'], None, order))
                order += 1
            
            if specs:
                execute_values(cur, """
                    INSERT INTO product_specifications 
                    (product_id, spec_key, spec_value, spec_unit, display_order)
                    VALUES %s
                """, specs)
            
            loaded += 1
            
        except Exception as e:
            cur.execute("ROLLBACK TO SAVEPOINT sp")
            errors.append((sku, p['name'], str(e)))
            continue
        
        # Commit every 50 products
        if loaded % 50 == 0:
            conn.commit()
    
    conn.commit()
    
    print(f"\nLoaded: {loaded} products", flush=True)
    if errors:
        print(f"Errors: {len(errors)}", flush=True)
        for sku, name, err in errors[:20]:
            print(f"  SKU {sku} ({name}): {err}", flush=True)
    
    return loaded, errors

def verify_load(conn):
    """Quick verification of loaded data."""
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM products")
    print(f"\n=== Verification ===")
    print(f"Total products: {cur.fetchone()[0]}")
    
    cur.execute("SELECT COUNT(*) FROM product_pricing")
    print(f"Product pricing records: {cur.fetchone()[0]}")
    
    cur.execute("SELECT COUNT(*) FROM product_dimensions")
    print(f"Product dimensions records: {cur.fetchone()[0]}")
    
    cur.execute("SELECT COUNT(*) FROM product_packaging")
    print(f"Product packaging records: {cur.fetchone()[0]}")
    
    cur.execute("SELECT COUNT(*) FROM product_specifications")
    print(f"Product specifications records: {cur.fetchone()[0]}")
    
    cur.execute("""
        SELECT b.name, COUNT(*) 
        FROM products p JOIN brands b ON p.brand_id = b.id 
        GROUP BY b.name ORDER BY COUNT(*) DESC
    """)
    print("\nProducts by brand:")
    for name, count in cur.fetchall():
        print(f"  {name}: {count}")
    
    cur.execute("""
        SELECT c.name, COUNT(*) 
        FROM products p JOIN categories c ON p.category_id = c.id 
        GROUP BY c.name ORDER BY COUNT(*) DESC
    """)
    print("\nProducts by category:")
    for name, count in cur.fetchall():
        print(f"  {name}: {count}")
    
    cur.execute("SELECT COUNT(*) FROM products WHERE category_id IS NULL")
    print(f"\nProducts without category: {cur.fetchone()[0]}")

def main():
    print("=" * 60)
    print("PRODUCT LOADER")
    print("=" * 60)
    
    # Step 1: Read Excel
    print("\n[1/5] Reading Excel file...")
    products, not_loaded, skipped = read_excel()
    
    # Step 2: Export not-loaded
    print("\n[2/5] Exporting not-loaded products...")
    export_not_loaded(not_loaded)
    
    # Step 3: Connect to DB & prepare lookup data
    print("\n[3/5] Connecting to database & preparing lookup data...")
    conn = psycopg2.connect(**DB_CONFIG)
    brand_map, designer_map, country_map, category_map = ensure_lookup_data(conn, products)
    
    # Step 4: Delete existing products
    print("\n[4/5] Clearing existing products...")
    delete_existing_products(conn)
    
    # Step 5: Load products
    print("\n[5/5] Loading products...")
    loaded, errors = load_products(conn, products, brand_map, designer_map, country_map, category_map)
    
    # Verify
    verify_load(conn)
    
    conn.close()
    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)

if __name__ == '__main__':
    main()

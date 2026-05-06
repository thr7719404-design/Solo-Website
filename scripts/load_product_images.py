"""
Product Image Loader – v2
1. Uses already-scraped Eva Solo image data (from progress file)
2. Falls back to DuckDuckGo image search for unmatched products
3. Downloads images, uploads to Azure Blob Storage, links in DB
"""
import os
import re
import sys
import time
import uuid
import json
import requests
import psycopg2
from urllib.parse import unquote, quote
from datetime import datetime
from azure.storage.blob import BlobServiceClient, ContentSettings

# ── CONFIG ─────────────────────────────────────────────────────────
DB_CONFIG = {
    'host': 'pg-qlyb5greec2io.postgres.database.azure.com',
    'port': 5432,
    'dbname': 'solo_ecommerce',
    'user': 'soloadmin',
    'password': os.environ.get('PGPASSWORD') or (_ for _ in ()).throw(SystemExit('PGPASSWORD env var is required.')),
    'sslmode': 'require',
}

AZURE_CONN_STR = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
if not AZURE_CONN_STR:
    raise SystemExit('AZURE_STORAGE_CONNECTION_STRING env var is required.')

CONTAINER = 'media'
BLOB_FOLDER = 'products'

BASE_URL = 'https://www.evasolo.com'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROGRESS_FILE = os.path.join(SCRIPT_DIR, 'image_scrape_progress.json')
UPLOAD_PROGRESS_FILE = os.path.join(SCRIPT_DIR, 'image_upload_progress.json')

MAX_IMAGE_WIDTH = 1200
MIN_IMAGE_SIZE = 5000  # 5KB min


# ── HELPERS ────────────────────────────────────────────────────────

def get_high_res_url(image_path):
    """Convert a Plytix image path to a high-res download URL."""
    encoded = quote(image_path, safe='/')
    return f'{BASE_URL}/Admin/Public/GetImage.ashx?width={MAX_IMAGE_WIDTH}&image={encoded}&format=webp&quality=90'


def download_image(url, session):
    """Download an image, return (bytes, content_type) or (None, None)."""
    try:
        resp = session.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        ct = resp.headers.get('Content-Type', 'image/jpeg')
        data = resp.content
        if len(data) < MIN_IMAGE_SIZE:
            return None, None
        return data, ct
    except Exception:
        return None, None


def upload_to_azure(container_client, image_data, content_type):
    """Upload image to Azure Blob Storage. Returns (blob_url, blob_key, mime, ext)."""
    file_uuid = str(uuid.uuid4())

    if 'webp' in content_type:
        mime, ext = 'image/webp', 'webp'
    elif 'png' in content_type:
        mime, ext = 'image/png', 'png'
    else:
        mime, ext = 'image/jpeg', 'jpg'

    filename = f'{file_uuid}.{ext}'
    blob_name = f'{BLOB_FOLDER}/{filename}'
    blob_client = container_client.get_blob_client(blob_name)

    blob_client.upload_blob(
        image_data,
        overwrite=True,
        content_settings=ContentSettings(
            content_type=mime,
            cache_control='public, max-age=31536000, immutable',
        ),
    )
    return blob_client.url, blob_name, filename, mime, ext, file_uuid


def create_db_records(cur, file_uuid, blob_folder, filename, mime, size, alt_text, product_id, display_order, is_primary):
    """Create media_assets + product_images records."""
    # media_assets uses camelCase columns
    cur.execute('''
        INSERT INTO media_assets (
            id, key, folder, filename, "mimeType", "sizeBytes",
            "altText", "isDeleted", "createdAt", "updatedAt"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, false, NOW(), NOW())
    ''', (
        file_uuid,
        f'{blob_folder}/{filename}',
        blob_folder,
        filename,
        mime,
        size,
        alt_text,
    ))

    # product_images uses snake_case columns
    cur.execute('''
        INSERT INTO product_images (
            product_id, media_asset_id, alt_text,
            display_order, is_primary, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
    ''', (
        product_id,
        file_uuid,
        alt_text,
        display_order,
        is_primary,
    ))


def load_upload_progress():
    """Load which SKUs have already been uploaded."""
    if os.path.exists(UPLOAD_PROGRESS_FILE):
        with open(UPLOAD_PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'uploaded_skus': [], 'stats': {'images': 0, 'errors': 0}}


def save_upload_progress(data):
    with open(UPLOAD_PROGRESS_FILE, 'w') as f:
        json.dump(data, f)


# ── PHASE 1: LOAD SCRAPED DATA ────────────────────────────────────

def load_scraped_data():
    """Load the SKU→image mappings from previous scraping run."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            data = json.load(f)
        if data.get('sku_images'):
            print(f'  Loaded scraped data: {len(data["sku_images"])} SKUs', flush=True)
            return data['sku_images']
    return {}


# ── PHASE 2: DUCKDUCKGO IMAGE SEARCH FALLBACK ─────────────────────

def search_product_image_ddg(product_name, brand, sku):
    """Search DuckDuckGo for product images. Returns list of image URLs."""
    try:
        from duckduckgo_search import DDGS
        
        # Construct search query
        if brand:
            query = f'{brand} {product_name}'
        else:
            query = f'Eva Solo {product_name}'
        
        with DDGS() as ddgs:
            results = list(ddgs.images(
                keywords=query,
                max_results=3,
                size='Medium',
                type_image='photo',
            ))
        
        # Filter results - prefer evasolo.com, connox.com, finnishdesignshop.com etc
        preferred_domains = ['evasolo.com', 'connox.', 'finnishdesignshop.', 'royaldesign.',
                           'plytix.com', 'cloudfront.net', 'shopify.com']
        urls = []
        preferred = []
        
        for r in results:
            img_url = r.get('image', '')
            if not img_url:
                continue
            # Check if from preferred domain
            is_preferred = any(d in img_url.lower() for d in preferred_domains)
            if is_preferred:
                preferred.append(img_url)
            else:
                urls.append(img_url)
        
        # Return preferred first, then others
        return (preferred + urls)[:3]
        
    except Exception as e:
        return []


# ── MAIN ──────────────────────────────────────────────────────────

def main():
    print('=' * 60, flush=True)
    print('PRODUCT IMAGE LOADER v2', flush=True)
    print('=' * 60, flush=True)

    session = requests.Session()

    # Load scraped data from previous run
    print('\n[1/5] Loading scraped data...', flush=True)
    scraped_images = load_scraped_data()

    # Connect to database
    print('\n[2/5] Loading products from database...', flush=True)
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        SELECT p.id, p.sku, p.name, b.name as brand
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        ORDER BY p.sku
    """)
    db_products = []
    for row in cur.fetchall():
        db_products.append({
            'id': row[0],
            'sku': str(row[1]),
            'name': row[2],
            'brand': row[3],
        })
    print(f'  Total products: {len(db_products)}', flush=True)

    # Separate into scraped-matched and search-needed
    scraped_matched = []
    search_needed = []
    for p in db_products:
        if p['sku'] in scraped_images:
            scraped_matched.append(p)
        else:
            search_needed.append(p)

    print(f'  Matched from Eva Solo scrape: {len(scraped_matched)}', flush=True)
    print(f'  Need DuckDuckGo search: {len(search_needed)}', flush=True)

    # Load upload progress for resumability
    progress = load_upload_progress()
    uploaded_skus = set(progress['uploaded_skus'])
    total_images = progress['stats']['images']
    total_errors = progress['stats']['errors']

    if uploaded_skus:
        print(f'  Resuming: {len(uploaded_skus)} already uploaded', flush=True)

    # Clear existing product images on first run
    if not uploaded_skus:
        cur.execute("SELECT COUNT(*) FROM product_images")
        existing = cur.fetchone()[0]
        if existing > 0:
            print(f'\n  Clearing {existing} existing product_images...', flush=True)
            cur.execute("DELETE FROM product_images")
            cur.execute("DELETE FROM media_assets WHERE folder = %s", (BLOB_FOLDER,))
            conn.commit()

    # Set up Azure Blob Storage
    print('\n[3/5] Setting up Azure Blob Storage...', flush=True)
    blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
    container_client = blob_service.get_container_client(CONTAINER)

    # ── PHASE A: Upload scraped Eva Solo images ────────────────────
    print('\n[4/5] Uploading images...', flush=True)
    print(f'\n  --- Part A: Eva Solo website images ({len(scraped_matched)} products) ---', flush=True)

    for i, product in enumerate(scraped_matched):
        sku = product['sku']
        if sku in uploaded_skus:
            continue

        if i % 10 == 0:
            print(f'  Scraped: {i}/{len(scraped_matched)} | Images: {total_images}', flush=True)

        image_paths = scraped_images[sku]
        
        # Sort: Default folder first
        def sort_key(path):
            if '/Default/' in path:
                return 0
            elif '/Lifestyle' in path:
                return 1
            return 2
        image_paths.sort(key=sort_key)
        image_paths = image_paths[:5]  # Max 5 images

        product_images_count = 0
        for display_order, img_path in enumerate(image_paths):
            try:
                cur.execute("SAVEPOINT img_sp")

                # Download high-res
                url = get_high_res_url(img_path)
                image_data, content_type = download_image(url, session)
                if not image_data:
                    # Try original file
                    url = f'{BASE_URL}{img_path}'
                    image_data, content_type = download_image(url, session)
                if not image_data:
                    cur.execute("RELEASE SAVEPOINT img_sp")
                    total_errors += 1
                    continue

                # Upload to Azure
                blob_url, blob_name, filename, mime, ext, file_uuid = upload_to_azure(
                    container_client, image_data, content_type
                )

                # Create DB records
                is_primary = (product_images_count == 0)
                create_db_records(
                    cur, file_uuid, BLOB_FOLDER, filename, mime,
                    len(image_data), product['name'],
                    product['id'], display_order, is_primary
                )

                cur.execute("RELEASE SAVEPOINT img_sp")
                product_images_count += 1
                total_images += 1
                time.sleep(0.3)

            except Exception as e:
                print(f'  Error SKU {sku}: {e}', flush=True)
                try:
                    cur.execute("ROLLBACK TO SAVEPOINT img_sp")
                except Exception:
                    pass
                total_errors += 1

        conn.commit()
        uploaded_skus.add(sku)

        # Save progress every 10 products
        if len(uploaded_skus) % 10 == 0:
            save_upload_progress({
                'uploaded_skus': list(uploaded_skus),
                'stats': {'images': total_images, 'errors': total_errors},
            })

    print(f'  Scraped products done. Images so far: {total_images}', flush=True)

    # ── PHASE B: DuckDuckGo search for remaining products ──────────
    print(f'\n  --- Part B: DuckDuckGo search ({len(search_needed)} products) ---', flush=True)

    ddg_found = 0
    ddg_not_found = 0

    for i, product in enumerate(search_needed):
        sku = product['sku']
        if sku in uploaded_skus:
            continue

        if i % 25 == 0:
            print(f'  Search: {i}/{len(search_needed)} | Found: {ddg_found} | Not found: {ddg_not_found} | Images: {total_images}', flush=True)

        # Search for images
        try:
            image_urls = search_product_image_ddg(product['name'], product['brand'], sku)
        except Exception as e:
            if 'Ratelimit' in str(e) or '429' in str(e):
                print(f'  Rate limited at product {i}. Waiting 30s...', flush=True)
                time.sleep(30)
                try:
                    image_urls = search_product_image_ddg(product['name'], product['brand'], sku)
                except Exception:
                    image_urls = []
            else:
                image_urls = []

        if not image_urls:
            ddg_not_found += 1
            uploaded_skus.add(sku)
            continue

        ddg_found += 1
        product_images_count = 0

        for display_order, img_url in enumerate(image_urls[:3]):
            try:
                cur.execute("SAVEPOINT img_sp")

                # Download image
                image_data, content_type = download_image(img_url, session)
                if not image_data:
                    cur.execute("RELEASE SAVEPOINT img_sp")
                    continue

                # Upload to Azure
                blob_url, blob_name, filename, mime, ext, file_uuid = upload_to_azure(
                    container_client, image_data, content_type
                )

                # Create DB records
                is_primary = (product_images_count == 0)
                create_db_records(
                    cur, file_uuid, BLOB_FOLDER, filename, mime,
                    len(image_data), product['name'],
                    product['id'], display_order, is_primary
                )

                cur.execute("RELEASE SAVEPOINT img_sp")
                product_images_count += 1
                total_images += 1

            except Exception as e:
                print(f'  Error SKU {sku} img {display_order}: {e}', flush=True)
                try:
                    cur.execute("ROLLBACK TO SAVEPOINT img_sp")
                except Exception:
                    pass
                total_errors += 1

        conn.commit()
        uploaded_skus.add(sku)

        # Rate limit DuckDuckGo searches
        time.sleep(1.5)

        # Save progress every 25 products
        if len(uploaded_skus) % 25 == 0:
            save_upload_progress({
                'uploaded_skus': list(uploaded_skus),
                'stats': {'images': total_images, 'errors': total_errors},
            })

    # Final save
    save_upload_progress({
        'uploaded_skus': list(uploaded_skus),
        'stats': {'images': total_images, 'errors': total_errors},
    })

    # ── VERIFY ─────────────────────────────────────────────────────
    print(f'\n[5/5] Verification...', flush=True)
    
    cur.execute("SELECT COUNT(*) FROM product_images")
    pi_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(DISTINCT product_id) FROM product_images")
    products_with_images = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM products")
    total_products = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM media_assets WHERE folder = %s", (BLOB_FOLDER,))
    ma_count = cur.fetchone()[0]

    print(f'\n{"="*60}', flush=True)
    print(f'RESULTS', flush=True)
    print(f'{"="*60}', flush=True)
    print(f'Total products: {total_products}', flush=True)
    print(f'Products WITH images: {products_with_images}', flush=True)
    print(f'Products WITHOUT images: {total_products - products_with_images}', flush=True)
    print(f'Total product_images records: {pi_count}', flush=True)
    print(f'Total media_assets: {ma_count}', flush=True)
    print(f'DuckDuckGo: {ddg_found} found, {ddg_not_found} not found', flush=True)
    print(f'Upload errors: {total_errors}', flush=True)

    cur.execute("""
        SELECT pi_count, COUNT(*) as product_count
        FROM (
            SELECT product_id, COUNT(*) as pi_count
            FROM product_images GROUP BY product_id
        ) sub
        GROUP BY pi_count ORDER BY pi_count
    """)
    print(f'\nImage count distribution:', flush=True)
    for count, products in cur.fetchall():
        print(f'  {count} image(s): {products} products', flush=True)

    conn.close()
    print(f'\n{"="*60}', flush=True)
    print('DONE', flush=True)
    print(f'{"="*60}', flush=True)


if __name__ == '__main__':
    main()

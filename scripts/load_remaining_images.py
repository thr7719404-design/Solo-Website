"""Load images for the remaining products that still have 0 images.

Reads:  d:\Solo Website\products_image_search_links.xlsx
        (sheet "Image Links" — Official Product Lookup column = evasolo.com page URL)

Strategy:
  1. Read the Excel → product_id → {sku, name, brand, page_url}
  2. Query DB → find which products from that list still have 0 images
  3. For each, scrape the evasolo.com product page for Plytix CDN image paths
  4. Download each image, upload to Azure Blob, insert media_assets + product_images

Run with firewall rule open to pg-qlyb5greec2io.postgres.database.azure.com:5432
"""

import os
import re
import sys
import time
import uuid
import json
import requests
import psycopg2
from pathlib import Path
from urllib.parse import unquote, quote
from bs4 import BeautifulSoup
from azure.storage.blob import BlobServiceClient, ContentSettings

# ── CONFIG ─────────────────────────────────────────────────────────

DB_CONFIG = {
    'host': os.environ.get('PG_HOST', 'pg-zuicxoppffzie.postgres.database.azure.com'),
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

ROOT_DIR = Path(__file__).resolve().parents[1]
EXCEL_FILE = ROOT_DIR / 'products_image_search_links.xlsx'
PROGRESS_FILE = Path(__file__).resolve().parent / 'load_remaining_progress.json'

BASE_URL = 'https://www.evasolo.com'
MAX_CANDIDATES = 3
MAX_IMAGE_WIDTH = 1200
MIN_IMAGE_SIZE = 5000  # 5 KB — skip tiny placeholders

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/131.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}
IMG_HEADERS = {
    'User-Agent': HEADERS['User-Agent'],
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Referer': BASE_URL,
}


# ── HELPERS ────────────────────────────────────────────────────────

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {
        'done_product_ids': [],
        'stats': {
            'products_done': 0,
            'images_uploaded': 0,
            'images_skipped': 0,
            'errors': 0,
        },
    }


def save_progress(data):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def get_high_res_url(image_path: str) -> str:
    image_path = unquote(image_path)
    if not image_path.startswith('/'):
        image_path = '/' + image_path
    encoded = quote(image_path, safe='/')
    return f'{BASE_URL}/Admin/Public/GetImage.ashx?width={MAX_IMAGE_WIDTH}&image={encoded}&format=webp&quality=90'


def extract_plytix_path(url_str: str):
    url_str = unquote(url_str)
    match = re.search(r'(/Files/Images/Plytix/[^\s"\'&]+)', url_str)
    return match.group(1) if match else None


def deduplicate_sizes(paths):
    seen = {}
    for path in paths:
        base = re.sub(r'_?\d+x\d+', '', path)
        base = re.sub(r'_square|_thumbnail', '', base)
        res_match = re.search(r'(\d+)x(\d+)', path)
        res = int(res_match.group(1)) * int(res_match.group(2)) if res_match else 0
        if base not in seen or res > seen[base][1]:
            seen[base] = (path, res)
    return [v[0] for v in seen.values()]


def scrape_product_page(page_url: str, session: requests.Session) -> list[str]:
    """Scrape an evasolo.com product page and return up to MAX_CANDIDATES Plytix image paths."""
    url = BASE_URL + page_url if page_url.startswith('/') else page_url
    try:
        resp = session.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        print(f'    !! Page fetch failed: {e}', flush=True)
        return []

    soup = BeautifulSoup(resp.text, 'html.parser')
    image_paths = set()

    for img in soup.find_all('img'):
        for attr in ['src', 'data-src', 'data-lazy-src', 'data-original']:
            val = img.get(attr, '')
            if val:
                path = extract_plytix_path(str(val))
                if path:
                    image_paths.add(path)

    for anchor in soup.find_all('a', href=True):
        path = extract_plytix_path(anchor['href'])
        if path:
            image_paths.add(path)

    for tag in soup.find_all(True):
        for attr_val in tag.attrs.values():
            values = [attr_val] if isinstance(attr_val, str) else (attr_val if isinstance(attr_val, list) else [])
            for value in values:
                if not isinstance(value, str) or 'GetImage.ashx' not in value:
                    continue
                m = re.search(r'image=([^&]+)', value)
                if m:
                    path = unquote(m.group(1))
                    if '/Plytix/' in path:
                        image_paths.add(path)

    for m in re.finditer(r'/Files/Images/Plytix/[^"\'&\s]+', resp.text):
        image_paths.add(unquote(m.group(0)))

    deduped = deduplicate_sizes(sorted(image_paths))
    return deduped[:MAX_CANDIDATES]


def download_image(url: str, session: requests.Session):
    """Returns (bytes, content_type) or (None, None)."""
    try:
        resp = session.get(url, headers=IMG_HEADERS, timeout=30, allow_redirects=True)
        resp.raise_for_status()
        ct = resp.headers.get('Content-Type', 'image/jpeg').split(';')[0].strip()
        data = resp.content
        if len(data) < MIN_IMAGE_SIZE:
            return None, None
        return data, ct
    except Exception:
        return None, None


def upload_to_azure(container_client, image_data: bytes, content_type: str):
    """Returns (blob_url, filename, mime, file_uuid)."""
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
    return blob_client.url, filename, mime, file_uuid


def create_db_records(cur, file_uuid, filename, mime, size, alt_text,
                      product_id, display_order, is_primary):
    blob_key = f'{BLOB_FOLDER}/{filename}'
    cur.execute('''
        INSERT INTO media_assets (
            id, key, folder, filename, "mimeType", "sizeBytes",
            "altText", "isDeleted", "createdAt", "updatedAt"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, false, NOW(), NOW())
    ''', (file_uuid, blob_key, BLOB_FOLDER, filename, mime, size, alt_text))

    cur.execute('''
        INSERT INTO product_images (
            product_id, media_asset_id, alt_text,
            display_order, is_primary, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
    ''', (product_id, file_uuid, alt_text, display_order, is_primary))


# ── EXCEL READER ──────────────────────────────────────────────────

def load_excel():
    """Read the Excel file. Returns list of dicts: product_id, sku, name, brand, page_url."""
    try:
        import openpyxl
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'openpyxl', '-q'], check=True)
        import openpyxl

    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
    ws = wb['Image Links']

    # Columns (1-indexed): ID, SKU, Product Name, Brand, Category,
    #   Image Search Link, Official Site Search Link, Official Product Lookup, Status/Notes
    COL_ID       = 1
    COL_SKU      = 2
    COL_NAME     = 3
    COL_BRAND    = 4
    COL_PAGE_URL = 8  # Official Product Lookup

    products = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[COL_ID - 1]:
            continue
        product_id = str(row[COL_ID - 1]).strip()
        sku = str(row[COL_SKU - 1]).strip() if row[COL_SKU - 1] else ''
        name = str(row[COL_NAME - 1]).strip() if row[COL_NAME - 1] else ''
        brand = str(row[COL_BRAND - 1]).strip() if row[COL_BRAND - 1] else ''
        page_url = str(row[COL_PAGE_URL - 1]).strip() if row[COL_PAGE_URL - 1] else ''

        if not page_url.startswith('http'):
            continue

        products.append({
            'product_id': product_id,
            'sku': sku,
            'name': name,
            'brand': brand,
            'page_url': page_url,
        })

    wb.close()
    return products


# ── MAIN ──────────────────────────────────────────────────────────

def main():
    print('=' * 65, flush=True)
    print('LOAD REMAINING IMAGES  (scrape evasolo.com → Azure Blob + DB)', flush=True)
    print('=' * 65, flush=True)

    # 1. Read Excel
    print(f'\n[1/4] Reading: {EXCEL_FILE.name}', flush=True)
    if not EXCEL_FILE.exists():
        print(f'  ERROR: File not found: {EXCEL_FILE}', flush=True)
        sys.exit(1)
    all_products = load_excel()
    print(f'  Loaded {len(all_products)} products from Excel', flush=True)

    # 2. Connect to services
    print('\n[2/4] Connecting to Azure Blob Storage...', flush=True)
    blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
    container_client = blob_service.get_container_client(CONTAINER)
    print('  Connected.', flush=True)

    print('\n[3/4] Connecting to PostgreSQL...', flush=True)
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()
    print('  Connected.', flush=True)

    # Find which products from the Excel STILL have 0 images
    product_ids = [p['product_id'] for p in all_products]
    cur.execute('''
        SELECT p.id::text
        FROM products p
        WHERE p.id::text = ANY(%s)
          AND NOT EXISTS (
              SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
          )
    ''', (product_ids,))
    zero_image_ids = {row[0] for row in cur.fetchall()}
    print(f'  Products from Excel with 0 images: {len(zero_image_ids)}', flush=True)

    # Load progress
    progress = load_progress()
    done_ids = set(progress['done_product_ids'])
    stats = progress['stats']

    # Filter to pending
    pending = [p for p in all_products
               if p['product_id'] in zero_image_ids and p['product_id'] not in done_ids]
    print(f'  Already done: {len(done_ids & zero_image_ids)}  |  Pending: {len(pending)}', flush=True)

    if not pending:
        print('\n  All remaining products already processed!', flush=True)
        cur.close()
        conn.close()
        return

    # 4. Process
    print(f'\n[4/4] Processing {len(pending)} products...', flush=True)
    session = requests.Session()

    for idx, product in enumerate(pending, start=1):
        pid = product['product_id']
        sku = product['sku']
        name = product['name']
        brand = product['brand']
        page_url = product['page_url']

        print(f'\n  [{idx:3d}/{len(pending)}] {sku}  {name}', flush=True)

        # Scrape the product page
        image_paths = scrape_product_page(page_url, session)
        if not image_paths:
            print(f'    → NO IMAGE PATHS FOUND on page', flush=True)
            # Still mark as done so we don't retry endlessly
            done_ids.add(pid)
            progress['done_product_ids'].append(pid)
            stats['products_done'] += 1
            stats['errors'] += 1
            if idx % 10 == 0:
                save_progress(progress)
            time.sleep(0.5)
            continue

        print(f'    → {len(image_paths)} path(s) found, downloading...', flush=True)

        uploaded_count = 0
        skipped_count = 0
        display_order = 0

        for path in image_paths:
            img_url = get_high_res_url(path)
            img_data, content_type = download_image(img_url, session)
            if img_data is None:
                skipped_count += 1
                continue

            alt_text = f'{brand} {name}' if brand else name
            is_primary = (display_order == 0)

            try:
                _, filename, mime, file_uuid = upload_to_azure(container_client, img_data, content_type)
                create_db_records(cur, file_uuid, filename, mime, len(img_data),
                                  alt_text, pid, display_order, is_primary)
                conn.commit()
                uploaded_count += 1
                display_order += 1
            except Exception as e:
                conn.rollback()
                print(f'    !! DB/Blob error: {e}', flush=True)
                skipped_count += 1

            time.sleep(0.2)

        if uploaded_count > 0:
            print(f'    ✓ {uploaded_count} uploaded, {skipped_count} skipped', flush=True)
        else:
            print(f'    ✗ 0 uploaded ({skipped_count} skipped/failed)', flush=True)
            stats['errors'] += 1

        stats['images_uploaded'] += uploaded_count
        stats['images_skipped'] += skipped_count
        stats['products_done'] += 1
        done_ids.add(pid)
        progress['done_product_ids'].append(pid)

        if idx % 10 == 0:
            save_progress(progress)

        time.sleep(0.5)

    save_progress(progress)
    cur.close()
    conn.close()

    print('\n' + '=' * 65, flush=True)
    print('DONE', flush=True)
    print(f'  Products processed : {stats["products_done"]}', flush=True)
    print(f'  Images uploaded    : {stats["images_uploaded"]}', flush=True)
    print(f'  Images skipped     : {stats["images_skipped"]}', flush=True)
    print(f'  Errors             : {stats["errors"]}', flush=True)
    print('=' * 65, flush=True)


if __name__ == '__main__':
    main()

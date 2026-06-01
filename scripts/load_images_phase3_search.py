"""
Phase 3: Search evasolo.com by SKU for products still missing images,
then extract the first product page URL, scrape Plytix images, upload.

Reads no Excel — queries DB for products with no images and processes all of them.
"""
import os
import re
import sys
import time
import uuid
import json
from urllib.parse import quote, urljoin

import requests
import psycopg2
from azure.storage.blob import BlobServiceClient, ContentSettings

# ── CONFIG ────────────────────────────────────────────────────────
DB_CONFIG = {
    'host': os.environ.get('PG_HOST', 'pg-zuicxoppffzie.postgres.database.azure.com'),
    'port': 5432,
    'dbname': 'solo_ecommerce',
    'user': 'soloadmin',
    'password': os.environ.get('PGPASSWORD') or sys.exit('PGPASSWORD env var is required.'),
    'sslmode': 'require',
}

AZURE_CONN_STR = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
if not AZURE_CONN_STR:
    sys.exit('AZURE_STORAGE_CONNECTION_STRING env var is required.')

CONTAINER = 'media'
BLOB_FOLDER = 'products'
BASE_URL = 'https://www.evasolo.com'
MAX_IMAGE_WIDTH = 1200
MIN_IMAGE_SIZE = 5000
MAX_CANDIDATES = 3
PROGRESS_FILE = os.path.join(os.path.dirname(__file__), 'phase3_progress.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Search endpoints to try in order
SEARCH_PATHS = [
    '/en/Default.aspx?ID=4244&q={sku}',  # English search
    '/en/search?q={sku}',
    '/Default.aspx?ID=4244&q={sku}',
]


# ── PROGRESS ──────────────────────────────────────────────────────
def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'done_product_ids': [], 'stats': {'products_done': 0, 'images_uploaded': 0, 'errors': 0, 'no_match': 0}}


def save_progress(p):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(p, f)


# ── SCRAPE ────────────────────────────────────────────────────────
PLYTIX_RE = re.compile(r'/Files/Images/Plytix/[^"\'&\s)]+\.(?:jpg|jpeg|png|webp)', re.IGNORECASE)
PRODUCT_LINK_RE = re.compile(r'href="(/en/[^"#?]+)"', re.IGNORECASE)


def fetch(url, session, timeout=30):
    try:
        r = session.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        r.raise_for_status()
        return r.text, r.url
    except Exception as e:
        return None, None


def find_product_page_for_sku(sku, session):
    """Try multiple search strategies to find a product page URL for the given SKU."""
    # Strategy 1: search endpoints
    for path_tmpl in SEARCH_PATHS:
        url = BASE_URL + path_tmpl.format(sku=quote(str(sku)))
        html, final_url = fetch(url, session)
        if not html:
            continue
        # If we were redirected straight to a product page, use it
        if final_url and '/en/' in final_url and final_url != url and 'search' not in final_url.lower() and 'Default.aspx' not in final_url:
            return final_url
        # Look for plytix image with this sku to confirm relevance
        plytix_paths = PLYTIX_RE.findall(html)
        sku_str = str(sku)
        product_links = []
        for href in PRODUCT_LINK_RE.findall(html):
            # Want links that look like product detail pages (>= 4 path segments)
            segments = [s for s in href.split('/') if s]
            if len(segments) >= 4:
                product_links.append(href)
        # Pick the first product link
        for link in product_links:
            return urljoin(BASE_URL, link)
        # If page itself contains plytix images for this sku, return search url itself
        for p in plytix_paths:
            if sku_str in p:
                return final_url or url
    return None


def scrape_product_page(page_url, sku, session):
    html, _ = fetch(page_url, session)
    if not html:
        return []
    paths = list(set(PLYTIX_RE.findall(html)))
    sku_str = str(sku)
    # Prefer images whose filename contains the SKU (matches this product)
    sku_matches = [p for p in paths if sku_str in p.rsplit('/', 1)[-1]]
    if sku_matches:
        paths = sku_matches
    # Sort: Default first
    paths.sort(key=lambda p: (0 if '/Default/' in p else 1, p))
    return paths[:MAX_CANDIDATES]


def get_high_res_url(image_path):
    encoded = quote(image_path, safe='/')
    return f'{BASE_URL}/Admin/Public/GetImage.ashx?width={MAX_IMAGE_WIDTH}&image={encoded}&format=webp&quality=90'


def download_image(url, session):
    try:
        r = session.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
        if len(r.content) < MIN_IMAGE_SIZE:
            return None, None
        return r.content, r.headers.get('Content-Type', 'image/jpeg')
    except Exception:
        return None, None


def upload_to_azure(container_client, data, content_type):
    if 'webp' in (content_type or ''):
        ct, ext = 'image/webp', 'webp'
    elif 'png' in (content_type or ''):
        ct, ext = 'image/png', 'png'
    else:
        ct, ext = 'image/jpeg', 'jpg'
    file_uuid = str(uuid.uuid4())
    filename = f'{file_uuid}.{ext}'
    blob_name = f'{BLOB_FOLDER}/{filename}'
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(
        data, overwrite=True,
        content_settings=ContentSettings(content_type=ct, cache_control='public, max-age=31536000, immutable'),
    )
    return filename, ct, file_uuid


def create_db_records(cur, file_uuid, filename, mime, size, alt_text, product_id, display_order, is_primary):
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


# ── MAIN ──────────────────────────────────────────────────────────
def main():
    print('=' * 65, flush=True)
    print('PHASE 3: search-by-SKU for products with no images', flush=True)
    print('=' * 65, flush=True)

    print('\nConnecting to Azure Blob...', flush=True)
    blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
    container_client = blob_service.get_container_client(CONTAINER)

    print('Connecting to PostgreSQL...', flush=True)
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute('''
        SELECT p.id::text, p.sku, p.name, b.name AS brand
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
        ORDER BY p.sku
    ''')
    rows = cur.fetchall()
    print(f'Products without images: {len(rows)}', flush=True)

    progress = load_progress()
    done_ids = set(progress['done_product_ids'])
    stats = progress['stats']

    pending = [r for r in rows if r[0] not in done_ids]
    print(f'Already attempted: {len(done_ids)}  |  Pending: {len(pending)}', flush=True)

    if not pending:
        print('Nothing to do.', flush=True)
        return

    session = requests.Session()

    for idx, (pid, sku, name, brand) in enumerate(pending, start=1):
        print(f'\n  [{idx:4d}/{len(pending)}] SKU={sku}  {name[:60]}', flush=True)

        try:
            page_url = find_product_page_for_sku(sku, session)
        except Exception as e:
            print(f'    !! search error: {e}', flush=True)
            page_url = None

        if not page_url:
            print(f'    -> NO product page found', flush=True)
            done_ids.add(pid)
            progress['done_product_ids'].append(pid)
            stats['products_done'] += 1
            stats['no_match'] += 1
            if idx % 10 == 0:
                save_progress(progress)
            continue

        try:
            image_paths = scrape_product_page(page_url, sku, session)
        except Exception as e:
            print(f'    !! scrape error: {e}', flush=True)
            image_paths = []

        if not image_paths:
            print(f'    -> No Plytix images on {page_url}', flush=True)
            done_ids.add(pid)
            progress['done_product_ids'].append(pid)
            stats['products_done'] += 1
            stats['no_match'] += 1
            if idx % 10 == 0:
                save_progress(progress)
            continue

        print(f'    -> {len(image_paths)} image path(s) at {page_url[:80]}', flush=True)

        uploaded = 0
        skipped = 0
        display_order = 0
        for path in image_paths:
            url = get_high_res_url(path)
            data, ct = download_image(url, session)
            if data is None:
                skipped += 1
                continue
            alt_text = f'{brand} {name}' if brand else name
            try:
                filename, mime, file_uuid = upload_to_azure(container_client, data, ct)
                create_db_records(cur, file_uuid, filename, mime, len(data),
                                  alt_text, pid, display_order, (display_order == 0))
                conn.commit()
                uploaded += 1
                display_order += 1
                stats['images_uploaded'] += 1
            except Exception as e:
                conn.rollback()
                print(f'    !! upload/db error: {e}', flush=True)
                stats['errors'] += 1

        print(f'    {uploaded} uploaded, {skipped} skipped', flush=True)
        done_ids.add(pid)
        progress['done_product_ids'].append(pid)
        stats['products_done'] += 1

        if idx % 10 == 0:
            save_progress(progress)
        time.sleep(0.5)

    save_progress(progress)
    cur.close()
    conn.close()

    print('\n' + '=' * 65, flush=True)
    print('PHASE 3 DONE', flush=True)
    for k, v in stats.items():
        print(f'  {k}: {v}', flush=True)
    print('=' * 65, flush=True)


if __name__ == '__main__':
    main()

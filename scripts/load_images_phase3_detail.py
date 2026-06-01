"""
Phase 3: Visit every /en/ URL in evasolo's sitemap that looks like a product detail page,
extract Plytix images, infer SKU from filenames, and match to DB products without images.
"""
import os
import re
import sys
import time
import uuid
import json
from urllib.parse import quote

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
SITEMAP_URL = f'{BASE_URL}/sitemap.xml'
MAX_IMAGE_WIDTH = 1200
MIN_IMAGE_SIZE = 5000
MAX_PER_SKU = 3
PROGRESS_FILE = os.path.join(os.path.dirname(__file__), 'phase3_detail_progress.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,*/*',
    'Accept-Language': 'en-US,en;q=0.5',
}

PLYTIX_RE = re.compile(r'/Files/Images/Plytix/[^"\'&\s)]+\.(?:jpg|jpeg|png|webp)', re.IGNORECASE)
SKU_RE = re.compile(r'^(\d{4,9})')

SKIP_PATTERNS = [
    '/recipes/', '/blog/', '/gift-ideas/', '/community/', '/contact', '/faq',
    '/terms', '/privacy', '/newsletter', '/cart', '/checkout', '/login',
    '/register', '/account', '/press', '/esg', '/code-of-conduct',
    '/product-safety', '/whistleblower', '/corporate-gifts',
    '/international-distribution', '/extended-warranties',
    '/returns-and-refunds', '/spareparts', '/about-us', '/design-awards',
    '/news/', '.pdf', '.jpg', '.png', 'facebook.com', 'instagram.com',
    'youtube.com', 'pinterest.', 'plytix.com', 'evasolo.cloud',
    'partnershop.evasolo', 'presscloud',
]


# ── PROGRESS ──────────────────────────────────────────────────────
def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'phase': 'init', 'sku_images': {}, 'visited': []}


def save_progress(p):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(p, f)


# ── SCRAPE ────────────────────────────────────────────────────────
def fetch(url, session):
    try:
        r = session.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
        if r.status_code != 200:
            return None
        return r.text
    except Exception:
        return None


def extract_plytix(html):
    return list(set(PLYTIX_RE.findall(html)))


def get_sku_from_filename(path):
    fn = path.rsplit('/', 1)[-1]
    m = SKU_RE.match(fn)
    return m.group(1) if m else None


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
    print('PHASE 3: detail-page scrape across full evasolo sitemap', flush=True)
    print('=' * 65, flush=True)

    session = requests.Session()
    progress = load_progress()
    sku_images = {k: list(v) for k, v in progress.get('sku_images', {}).items()}
    visited = set(progress.get('visited', []))

    # Step 1: get all candidate URLs
    if progress.get('phase') in ('init', None) or not sku_images:
        print('\n[1] Fetching sitemap...', flush=True)
        html = fetch(SITEMAP_URL, session)
        urls = re.findall(r'<loc>([^<]+)</loc>', html)
        print(f'  Total sitemap URLs: {len(urls)}', flush=True)

        candidates = []
        for u in urls:
            if not u.startswith('https://www.evasolo.com/'):
                continue
            low = u.lower()
            if any(p in low for p in SKIP_PATTERNS):
                continue
            # Take /en/ paths with at least 4 segments after .com
            path = u.replace(BASE_URL, '')
            segs = [s for s in path.split('/') if s]
            if len(segs) >= 3:
                candidates.append(u)
        # Dedup
        candidates = sorted(set(candidates))
        print(f'  Candidate URLs: {len(candidates)}', flush=True)

        # Step 2: visit each, collect Plytix paths grouped by SKU
        print('\n[2] Visiting candidate URLs...', flush=True)
        for i, url in enumerate(candidates):
            if url in visited:
                continue
            if i % 25 == 0:
                print(f'  {i}/{len(candidates)} pages | unique SKUs so far: {len(sku_images)}', flush=True)
            html = fetch(url, session)
            visited.add(url)
            if not html:
                continue
            for path in extract_plytix(html):
                sku = get_sku_from_filename(path)
                if not sku:
                    continue
                if sku not in sku_images:
                    sku_images[sku] = []
                if path not in sku_images[sku]:
                    sku_images[sku].append(path)
            if i % 50 == 0:
                progress['sku_images'] = sku_images
                progress['visited'] = list(visited)
                save_progress(progress)
            time.sleep(0.4)

        progress['phase'] = 'scraped'
        progress['sku_images'] = sku_images
        progress['visited'] = list(visited)
        save_progress(progress)
        print(f'\n  Done crawling. Unique SKUs found: {len(sku_images)}', flush=True)

    # Step 3: connect DB, find products without images
    print('\n[3] Connecting to PostgreSQL...', flush=True)
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute('''
        SELECT p.id::text, p.sku, p.name, b.name AS brand
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
    ''')
    rows = cur.fetchall()
    print(f'  Products without images: {len(rows)}', flush=True)

    matched = [(pid, sku, name, brand) for pid, sku, name, brand in rows if str(sku) in sku_images]
    print(f'  Matched to scraped SKU images: {len(matched)}', flush=True)

    if not matched:
        print('No matches. Exiting.', flush=True)
        return

    print('\n[4] Connecting to Azure Blob...', flush=True)
    blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
    container_client = blob_service.get_container_client(CONTAINER)

    print('\n[5] Downloading + uploading...', flush=True)
    uploaded_total = 0
    errors = 0
    for idx, (pid, sku, name, brand) in enumerate(matched, start=1):
        paths = sku_images[str(sku)]
        # Sort: Default first
        paths_sorted = sorted(paths, key=lambda p: (0 if '/Default/' in p else 1, p))[:MAX_PER_SKU]
        if idx % 25 == 0 or idx == len(matched):
            print(f'  [{idx}/{len(matched)}] uploaded so far: {uploaded_total}', flush=True)
        display_order = 0
        for path in paths_sorted:
            url = get_high_res_url(path)
            data, ct = download_image(url, session)
            if data is None:
                continue
            alt_text = f'{brand} {name}' if brand else name
            try:
                filename, mime, file_uuid = upload_to_azure(container_client, data, ct)
                create_db_records(cur, file_uuid, filename, mime, len(data),
                                  alt_text, pid, display_order, (display_order == 0))
                conn.commit()
                uploaded_total += 1
                display_order += 1
            except Exception as e:
                conn.rollback()
                errors += 1
                print(f'    !! upload/db error for SKU {sku}: {e}', flush=True)

    print('\n' + '=' * 65, flush=True)
    print(f'PHASE 3 DONE  uploaded={uploaded_total} errors={errors}', flush=True)
    print('=' * 65, flush=True)

    cur.close()
    conn.close()


if __name__ == '__main__':
    main()

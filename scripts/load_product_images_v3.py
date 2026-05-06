"""
Product Image Loader – v3
Strategy:
  1. Query DB for ALL products without images (626 from v2 run)
  2. For each, search evasolo.com by SKU → get product detail page URL
  3. Fetch detail page → extract ALL Plytix image paths (up to 10 per product)
  4. Download high-res images → upload to Azure Blob → create DB records
  5. Fall back to DuckDuckGo only for truly not-found products
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
from bs4 import BeautifulSoup
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
SEARCH_URL = BASE_URL + '/en/shop?q={query}'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/131.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROGRESS_FILE = os.path.join(SCRIPT_DIR, 'image_upload_progress_v3.json')

MAX_IMAGE_WIDTH = 1200
MAX_IMAGES_PER_PRODUCT = 8
MIN_IMAGE_SIZE = 5000  # 5KB – skip tiny placeholders/icons


# ── HELPERS ────────────────────────────────────────────────────────

def get_high_res_url(image_path):
    """Convert a Plytix image path to a high-res download URL."""
    # Normalise double-encoded slashes
    image_path = unquote(image_path)
    if not image_path.startswith('/'):
        image_path = '/' + image_path
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
    """Upload image to Azure Blob Storage. Returns tuple of details."""
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


def create_db_records(cur, file_uuid, blob_folder, filename, mime, size,
                      alt_text, product_id, display_order, is_primary):
    """Create media_assets + product_images records."""
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
    cur.execute('''
        INSERT INTO product_images (
            product_id, media_asset_id, alt_text,
            display_order, is_primary, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
    ''', (product_id, file_uuid, alt_text, display_order, is_primary))


# ── EVASOLO.COM SEARCH + SCRAPE ───────────────────────────────────

def search_evasolo_by_sku(sku, session):
    """Search evasolo.com by SKU, return the product page URL if found."""
    url = SEARCH_URL.format(query=sku)
    try:
        resp = session.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        # Product links in search results look like:
        #   <a href="/en/table/tableware/cups/espresso-tumbler-2-pcs-carbon-black">
        # with an image inside containing /Files/Images/Plytix/ path
        product_links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            # Product pages have at least 4 path segments: /en/cat/sub/product
            if href.startswith('/en/') and href.count('/') >= 4:
                # Check if it contains an image with our SKU or Plytix pattern
                img = a_tag.find('img')
                if img and img.get('src', ''):
                    src = img['src']
                    if '/Plytix/' in src or '/Files/Images/' in src:
                        product_links.append(href)
                elif img and img.get('data-src', ''):
                    src = img['data-src']
                    if '/Plytix/' in src or '/Files/Images/' in src:
                        product_links.append(href)

        # If we found product links, also check if SKU appears in any image src
        if not product_links:
            # Broader search: any link going to what looks like a product page
            for a_tag in soup.find_all('a', href=True):
                href = a_tag['href']
                if href.startswith('/en/') and href.count('/') >= 4 and '/shop' not in href:
                    # Exclude non-product pages
                    skip = ['/blog/', '/gift-ideas/', '/contact', '/faq', '/about',
                            '/terms', '/privacy', '/newsletter', '/returns', '/press',
                            '/code-of-conduct', '/esg', '/product-safety', '/corporate',
                            '/extended-warranties', '/whistleblower', '/international',
                            '/spareparts']
                    if not any(s in href for s in skip):
                        product_links.append(href)

        # Check for SKU in image sources from search results
        sku_in_images = []
        for img in soup.find_all('img'):
            src = img.get('src', '') or img.get('data-src', '')
            if sku in src and '/Plytix/' in src:
                sku_in_images.append(src)

        if product_links:
            # Deduplicate
            unique_links = list(dict.fromkeys(product_links))
            return unique_links[0], sku_in_images
        return None, sku_in_images

    except Exception as e:
        return None, []


def extract_product_images(product_page_url, sku, session):
    """Fetch a product detail page and extract all Plytix image paths."""
    url = BASE_URL + product_page_url if product_page_url.startswith('/') else product_page_url
    try:
        resp = session.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        image_paths = set()

        # Pattern 1: <img> tags with Plytix paths
        for img in soup.find_all('img'):
            for attr in ['src', 'data-src', 'data-lazy-src', 'data-original']:
                val = img.get(attr, '')
                if val and '/Files/Images/Plytix/' in val:
                    # Extract the Plytix path
                    path = extract_plytix_path(val)
                    if path:
                        image_paths.add(path)

        # Pattern 2: <a> tags linking directly to Plytix images
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if '/Files/Images/Plytix/' in href:
                path = extract_plytix_path(href)
                if path:
                    image_paths.add(path)

        # Pattern 3: GetImage.ashx URLs in any attribute
        for tag in soup.find_all(True):
            for attr_val in tag.attrs.values():
                if isinstance(attr_val, str) and 'GetImage.ashx' in attr_val:
                    # Extract image= parameter
                    match = re.search(r'image=([^&]+)', attr_val)
                    if match:
                        path = unquote(match.group(1))
                        if '/Plytix/' in path:
                            image_paths.add(path)
                elif isinstance(attr_val, list):
                    for v in attr_val:
                        if isinstance(v, str) and 'GetImage.ashx' in v:
                            match = re.search(r'image=([^&]+)', v)
                            if match:
                                path = unquote(match.group(1))
                                if '/Plytix/' in path:
                                    image_paths.add(path)

        # Pattern 4: Search the raw HTML for any Plytix paths we missed
        raw = resp.text
        for match in re.finditer(r'/Files/Images/Plytix/[^"\'&\s]+', raw):
            path = unquote(match.group(0))
            # Filter out tiny icons, thumbnails in file name shouldn't be excluded
            image_paths.add(path)

        # Sort: Default folder first, then Lifestyle
        def sort_key(p):
            if '/Default/' in p:
                return (0, p)
            elif '/Lifestyle_Photo_1/' in p:
                return (1, p)
            elif '/Lifestyle_Photo_2/' in p:
                return (2, p)
            return (3, p)

        sorted_paths = sorted(image_paths, key=sort_key)

        # Prefer largest resolution variant per unique base name
        deduplicated = deduplicate_sizes(sorted_paths)

        return deduplicated[:MAX_IMAGES_PER_PRODUCT]

    except Exception as e:
        return []


def extract_plytix_path(url_str):
    """Extract the /Files/Images/Plytix/... path from a URL or attribute value."""
    url_str = unquote(url_str)
    match = re.search(r'(/Files/Images/Plytix/[^\s"\'&]+)', url_str)
    if match:
        return match.group(1)
    return None


def deduplicate_sizes(paths):
    """Among paths pointing to the same image at different sizes, keep the largest."""
    # Many filenames look like: 501001-coffee-tumble-espresso-carbon-black_square_886x886.png
    # or 501001-coffee-tumble-espresso-carbon-black_1500x1500.png. Keep the biggest.
    seen_bases = {}
    for path in paths:
        # Strip resolution suffixes to get a "base" identifier
        base = re.sub(r'_?\d+x\d+', '', path)
        base = re.sub(r'_square', '', base)
        base = re.sub(r'_thumbnail', '', base)

        # Extract resolution
        res_match = re.search(r'(\d+)x(\d+)', path)
        res = int(res_match.group(1)) * int(res_match.group(2)) if res_match else 0

        if base not in seen_bases or res > seen_bases[base][1]:
            seen_bases[base] = (path, res)

    return [v[0] for v in seen_bases.values()]


# ── DUCKDUCKGO FALLBACK ───────────────────────────────────────────

def search_ddg(product_name, brand, sku):
    """Search DuckDuckGo for product images. Returns list of image URLs."""
    try:
        from duckduckgo_search import DDGS

        queries = []
        if brand:
            queries.append(f'{brand} {product_name} product')
            queries.append(f'{brand} {sku}')
        else:
            queries.append(f'Eva Solo {product_name} product')

        all_urls = []
        with DDGS() as ddgs:
            for q in queries:
                if len(all_urls) >= 3:
                    break
                try:
                    results = list(ddgs.images(keywords=q, max_results=3,
                                               size='Medium', type_image='photo'))
                    for r in results:
                        img_url = r.get('image', '')
                        if img_url and img_url not in all_urls:
                            all_urls.append(img_url)
                except Exception:
                    pass
                time.sleep(0.5)

        return all_urls[:3]
    except Exception:
        return []


# ── PROGRESS ──────────────────────────────────────────────────────

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'done_skus': [], 'stats': {'images': 0, 'evasolo_found': 0,
                                        'ddg_found': 0, 'not_found': 0, 'errors': 0}}


def save_progress(data):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f)


# ── MAIN ──────────────────────────────────────────────────────────

def main():
    print('=' * 60, flush=True)
    print('PRODUCT IMAGE LOADER v3 – Eva Solo Site Search', flush=True)
    print('=' * 60, flush=True)

    session = requests.Session()

    # Connect to DB
    print('\n[1/4] Loading products WITHOUT images...', flush=True)
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Get products that have NO images yet
    cur.execute("""
        SELECT p.id, p.sku, p.name, b.name AS brand
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id NOT IN (SELECT DISTINCT product_id FROM product_images)
        ORDER BY p.sku
    """)
    products = []
    for row in cur.fetchall():
        products.append({
            'id': row[0],
            'sku': str(row[1]),
            'name': row[2],
            'brand': row[3],
        })
    print(f'  Products without images: {len(products)}', flush=True)

    if not products:
        print('\n  All products already have images!', flush=True)
        conn.close()
        return

    # Load progress
    progress = load_progress()
    done_skus = set(progress['done_skus'])
    stats = progress['stats']
    if done_skus:
        print(f'  Resuming: {len(done_skus)} already processed', flush=True)

    # Azure Blob
    print('\n[2/4] Connecting to Azure Blob Storage...', flush=True)
    blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
    container_client = blob_service.get_container_client(CONTAINER)

    print('\n[3/4] Processing products...', flush=True)
    total = len(products)
    batch_count = 0

    for idx, product in enumerate(products):
        sku = product['sku']
        if sku in done_skus:
            continue

        if batch_count % 20 == 0:
            print(f'\n  Progress: {batch_count}/{total - len(done_skus)} | '
                  f'EvaSolo: {stats["evasolo_found"]} | DDG: {stats["ddg_found"]} | '
                  f'NotFound: {stats["not_found"]} | Images: {stats["images"]}',
                  flush=True)

        batch_count += 1

        # ── STRATEGY 1: Search evasolo.com by SKU ─────────────────
        image_paths = []
        product_page_url, search_img_srcs = search_evasolo_by_sku(sku, session)
        time.sleep(0.3)

        if product_page_url:
            # Fetch detail page for full image gallery
            image_paths = extract_product_images(product_page_url, sku, session)
            time.sleep(0.3)

        # Also try search result images if no detail page images found
        if not image_paths and search_img_srcs:
            for src in search_img_srcs:
                path = extract_plytix_path(src)
                if path:
                    image_paths.append(path)

        source = 'evasolo'
        image_urls = []

        if image_paths:
            # Convert Plytix paths to high-res download URLs
            image_urls = [get_high_res_url(p) for p in image_paths]
            stats['evasolo_found'] += 1
        else:
            # ── STRATEGY 2: DuckDuckGo fallback ───────────────────
            image_urls = search_ddg(product['name'], product['brand'], sku)
            source = 'ddg'
            if image_urls:
                stats['ddg_found'] += 1
            else:
                stats['not_found'] += 1
                done_skus.add(sku)
                if batch_count % 20 == 0:
                    save_progress({'done_skus': list(done_skus), 'stats': stats})
                continue

        # ── Download & Upload ─────────────────────────────────────
        product_img_count = 0
        for display_order, img_url in enumerate(image_urls):
            try:
                cur.execute("SAVEPOINT img_sp")

                image_data, content_type = download_image(img_url, session)
                if not image_data:
                    cur.execute("RELEASE SAVEPOINT img_sp")
                    continue

                blob_url, blob_name, filename, mime, ext, file_uuid = upload_to_azure(
                    container_client, image_data, content_type
                )

                is_primary = (product_img_count == 0)
                create_db_records(
                    cur, file_uuid, BLOB_FOLDER, filename, mime,
                    len(image_data), product['name'],
                    product['id'], display_order, is_primary
                )

                cur.execute("RELEASE SAVEPOINT img_sp")
                product_img_count += 1
                stats['images'] += 1
                time.sleep(0.15)

            except Exception as e:
                print(f'    ERR {sku} img#{display_order}: {e}', flush=True)
                try:
                    cur.execute("ROLLBACK TO SAVEPOINT img_sp")
                except Exception:
                    pass
                stats['errors'] += 1

        conn.commit()
        done_skus.add(sku)

        if product_img_count > 0:
            print(f'    ✓ {sku} ({product["name"][:40]}) → {product_img_count} imgs [{source}]',
                  flush=True)

        # Save progress every 20 products
        if batch_count % 20 == 0:
            save_progress({'done_skus': list(done_skus), 'stats': stats})

    # Final progress save
    save_progress({'done_skus': list(done_skus), 'stats': stats})

    # ── VERIFY ─────────────────────────────────────────────────────
    print(f'\n[4/4] Verification...', flush=True)

    cur.execute("SELECT COUNT(*) FROM product_images")
    pi_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT product_id) FROM product_images")
    products_with_images = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM products")
    total_products = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM media_assets WHERE folder = %s", (BLOB_FOLDER,))
    ma_count = cur.fetchone()[0]

    print(f'\n{"="*60}', flush=True)
    print(f'FINAL RESULTS', flush=True)
    print(f'{"="*60}', flush=True)
    print(f'Total products:            {total_products}', flush=True)
    print(f'Products WITH images:      {products_with_images} ({100*products_with_images//total_products}%)', flush=True)
    print(f'Products WITHOUT images:   {total_products - products_with_images}', flush=True)
    print(f'Total product_images:      {pi_count}', flush=True)
    print(f'Total media_assets:        {ma_count}', flush=True)
    print(f'', flush=True)
    print(f'This run:', flush=True)
    print(f'  Eva Solo site found:     {stats["evasolo_found"]}', flush=True)
    print(f'  DuckDuckGo found:        {stats["ddg_found"]}', flush=True)
    print(f'  Not found anywhere:      {stats["not_found"]}', flush=True)
    print(f'  Images uploaded:         {stats["images"]}', flush=True)
    print(f'  Errors:                  {stats["errors"]}', flush=True)

    cur.execute("""
        SELECT pi_count, COUNT(*) AS product_count
        FROM (
            SELECT product_id, COUNT(*) AS pi_count
            FROM product_images GROUP BY product_id
        ) sub GROUP BY pi_count ORDER BY pi_count
    """)
    print(f'\nImage count distribution:', flush=True)
    for count, prods in cur.fetchall():
        print(f'  {count} image(s): {prods} products', flush=True)

    conn.close()
    print(f'\n{"="*60}', flush=True)
    print('DONE', flush=True)
    print(f'{"="*60}', flush=True)


if __name__ == '__main__':
    main()

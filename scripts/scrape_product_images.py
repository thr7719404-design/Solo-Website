"""
Product Image Scraper & Loader
Scrapes product images from evasolo.com, downloads high-res versions,
uploads to Azure Blob Storage, and links them to products in the database.
"""
import os
import re
import sys
import time
import uuid
import json
import hashlib
import requests
import psycopg2
from urllib.parse import unquote, quote
from datetime import datetime
from bs4 import BeautifulSoup
from azure.storage.blob import BlobServiceClient, ContentSettings
from concurrent.futures import ThreadPoolExecutor, as_completed

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

BASE_URL = 'https://www.evasolo.com'
SITEMAP_URL = f'{BASE_URL}/sitemap.xml'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Rate-limiting
REQUEST_DELAY = 1.0  # seconds between requests to be polite

# Image download settings
MAX_IMAGE_WIDTH = 1200  # Request this width from GetImage.ashx
MIN_IMAGE_SIZE = 5000   # Skip images smaller than 5KB (likely broken)

# Progress file for resumability
PROGRESS_FILE = os.path.join(os.path.dirname(__file__), 'image_scrape_progress.json')

# ── HELPERS ────────────────────────────────────────────────────────

def extract_sku_from_filename(filename):
    """Extract SKU number from a Plytix image filename."""
    # Filenames start with the SKU: 567010_To_go_cup_35cl_Black_thumbnail.jpg
    match = re.match(r'^(\d{4,7})', filename)
    return match.group(1) if match else None


def get_high_res_url(image_path):
    """Convert a Plytix image path to a high-res download URL."""
    # image_path like: /Files/Images/Plytix/Default/567010_xxx.jpg
    encoded = quote(image_path, safe='/')
    return f'{BASE_URL}/Admin/Public/GetImage.ashx?width={MAX_IMAGE_WIDTH}&image={encoded}&format=webp&quality=90'


def get_original_url(image_path):
    """Get the original image file URL (not resized)."""
    return f'{BASE_URL}{image_path}'


def parse_plytix_images(html):
    """Extract all Plytix image paths from HTML content."""
    images = set()
    # Pattern: /Files/Images/Plytix/{folder}/{filename}.{ext}
    pattern = r'/Files/Images/Plytix/[^"\'&\s)]+\.(?:jpg|jpeg|png|webp)'
    for match in re.findall(pattern, html, re.IGNORECASE):
        # URL-decode
        decoded = unquote(unquote(match))
        images.add(decoded)
    return images


def extract_sku_image_map(images):
    """Group images by SKU."""
    sku_map = {}
    for img_path in images:
        filename = img_path.rsplit('/', 1)[-1]
        sku = extract_sku_from_filename(filename)
        if sku:
            if sku not in sku_map:
                sku_map[sku] = []
            sku_map[sku].append(img_path)
    return sku_map


def fetch_page(url, session):
    """Fetch a page with rate limiting and error handling."""
    time.sleep(REQUEST_DELAY)
    try:
        resp = session.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f'  Error fetching {url}: {e}', flush=True)
        return None


def save_progress(data):
    """Save progress to disk for resumability."""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f)


def load_progress():
    """Load progress from disk."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return None


# ── PHASE 1: DISCOVER ALL CATEGORY PAGES FROM SITEMAP ─────────────

def get_category_urls(session):
    """Extract category/product listing page URLs from the sitemap."""
    print('\n[Phase 1] Fetching sitemap...', flush=True)
    html = fetch_page(SITEMAP_URL, session)
    if not html:
        return []

    # Extract all URLs
    urls = re.findall(r'<loc>([^<]+)</loc>', html)
    print(f'  Total sitemap URLs: {len(urls)}', flush=True)

    # Filter to English product category pages
    # These contain product listings with images
    category_urls = []
    skip_patterns = [
        '/recipes/', '/blog/', '/gift-ideas/', '/community/',
        '/contact', '/faq', '/terms', '/privacy', '/newsletter',
        '/cart', '/checkout', '/login', '/register', '/account',
        '/press', '/esg', '/code-of-conduct', '/product-safety',
        '/whistleblower', '/corporate-gifts', '/international-distribution',
        '/extended-warranties', '/returns-and-refunds', '/spareparts',
        '/about-us', '/design-awards', '/news/',
        '.pdf', '.jpg', '.png',
    ]

    for url in urls:
        # Must be English version
        if '/en/' not in url and not url.endswith('.com/home'):
            # Also include non-language-prefixed category pages
            pass

        # Skip non-product pages
        skip = False
        for pat in skip_patterns:
            if pat in url.lower():
                skip = True
                break
        if skip:
            continue

        # Category pages typically have 2-4 path segments after domain
        path = url.replace(BASE_URL, '')
        segments = [s for s in path.split('/') if s]
        if len(segments) >= 2:
            category_urls.append(url)

    # Also add the /en/ prefixed versions of key categories
    known_categories = [
        '/en/kitchen/cookware/pots',
        '/en/kitchen/cookware/pans',
        '/en/kitchen/cookware/accessories',
        '/en/kitchen/equipment/knives',
        '/en/kitchen/equipment/kitchen-accessories',
        '/en/kitchen/equipment/kitchen-utensils',
        '/en/kitchen/equipment/cutting-boards',
        '/en/table/tableware/cups-mugs',
        '/en/table/tableware/plates',
        '/en/table/tableware/bowls',
        '/en/table/tableware/glasses',
        '/en/table/tableware/serve',
        '/en/table/tableware/accessories',
        '/en/table/tableware/carafes-jugs',
        '/en/table/tableware/egg-cups',
        '/en/table/tea-coffee/vacuum-jugs',
        '/en/table/tea-coffee/teapots',
        '/en/table/tea-coffee/french-press',
        '/en/table/tea-coffee/electric-kettles',
        '/en/table/tea-coffee/tea-coffee-accessories',
        '/en/to-go/to-go/thermo-cups',
        '/en/to-go/to-go/thermo-flasks',
        '/en/to-go/to-go/lunch-boxes',
        '/en/to-go/to-go/to-go-accessories',
        '/en/home/outdoor/bird-feeders',
        '/en/home/outdoor/bird-tables',
        '/en/home/outdoor/lanterns',
        '/en/home/outdoor/fire-globes',
        '/en/home/indoor/waste-bins',
        '/en/home/indoor/soap-dispensers',
        '/en/home/indoor/candle-holders',
        '/en/home/indoor/vases',
        '/en/home/indoor/storage',
        '/en/home/indoor/hooks-hangers',
        '/en/home/indoor/tissue-holders',
        '/en/new-arrivals',
        '/en/current-offers',
        '/en/kitchen/cookware',
        '/en/kitchen/equipment',
        '/en/table/tableware',
        '/en/table/tea-coffee',
        '/en/to-go/to-go',
        '/en/home/outdoor',
        '/en/home/indoor',
    ]

    for cat_path in known_categories:
        full_url = BASE_URL + cat_path
        if full_url not in category_urls:
            category_urls.append(full_url)

    print(f'  Category URLs to scrape: {len(category_urls)}', flush=True)
    return category_urls


# ── PHASE 2: SCRAPE CATEGORY PAGES FOR IMAGE URLs ─────────────────

def scrape_category_pages(category_urls, session):
    """Scrape all category pages to collect SKU → image path mappings."""
    print('\n[Phase 2] Scraping category pages for product images...', flush=True)

    all_sku_images = {}
    product_page_urls = {}
    pages_scraped = 0

    for i, url in enumerate(category_urls):
        if i % 10 == 0:
            print(f'  Progress: {i}/{len(category_urls)} pages...', flush=True)

        html = fetch_page(url, session)
        if not html:
            continue

        pages_scraped += 1

        # Extract all Plytix image paths
        images = parse_plytix_images(html)
        sku_map = extract_sku_image_map(images)

        for sku, img_paths in sku_map.items():
            if sku not in all_sku_images:
                all_sku_images[sku] = set()
            all_sku_images[sku].update(img_paths)

        # Also extract product page URLs for Phase 2b
        soup = BeautifulSoup(html, 'html.parser')
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.startswith('/en/') and href.count('/') >= 4:
                # Check if the linked page contains a product image
                img = a.find('img')
                if img and img.get('src', ''):
                    src = img['src']
                    if 'Plytix' in src:
                        full_url = BASE_URL + href
                        # Extract SKU from image
                        for img_path in parse_plytix_images(str(a)):
                            filename = img_path.rsplit('/', 1)[-1]
                            sku = extract_sku_from_filename(filename)
                            if sku:
                                product_page_urls[sku] = full_url

        # Check for pagination
        if 'Load more products' in html or 'PageNum=2' in html:
            # Try pages 2-5
            for page in range(2, 6):
                page_url = f'{url}?PageNum={page}'
                page_html = fetch_page(page_url, session)
                if not page_html or 'no results' in page_html.lower():
                    break
                images = parse_plytix_images(page_html)
                if not images:
                    break
                sku_map = extract_sku_image_map(images)
                for sku, img_paths in sku_map.items():
                    if sku not in all_sku_images:
                        all_sku_images[sku] = set()
                    all_sku_images[sku].update(img_paths)

    # Convert sets to lists for JSON serialization
    result = {sku: list(paths) for sku, paths in all_sku_images.items()}

    print(f'  Pages scraped: {pages_scraped}', flush=True)
    print(f'  Unique SKUs with images: {len(result)}', flush=True)
    total_images = sum(len(v) for v in result.values())
    print(f'  Total image paths found: {total_images}', flush=True)

    return result, product_page_urls


# ── PHASE 2b: SCRAPE PRODUCT DETAIL PAGES FOR MORE IMAGES ─────────

def scrape_product_pages(db_skus, sku_images, product_page_urls, session):
    """Visit product detail pages to find additional images."""
    # Only scrape product pages for SKUs that we have in our DB
    # and that have a known product page URL
    skus_to_scrape = []
    for sku in db_skus:
        if sku in product_page_urls:
            current_count = len(sku_images.get(sku, []))
            if current_count < 3:  # Only scrape if we have < 3 images
                skus_to_scrape.append(sku)

    if not skus_to_scrape:
        return sku_images

    print(f'\n[Phase 2b] Scraping {len(skus_to_scrape)} product pages for additional images...', flush=True)

    for i, sku in enumerate(skus_to_scrape):
        if i % 25 == 0:
            print(f'  Progress: {i}/{len(skus_to_scrape)}...', flush=True)

        url = product_page_urls[sku]
        html = fetch_page(url, session)
        if not html:
            continue

        images = parse_plytix_images(html)
        # Filter to only images for THIS SKU
        for img_path in images:
            filename = img_path.rsplit('/', 1)[-1]
            img_sku = extract_sku_from_filename(filename)
            if img_sku == sku:
                if sku not in sku_images:
                    sku_images[sku] = []
                if img_path not in sku_images[sku]:
                    sku_images[sku].append(img_path)

    print(f'  Done. Updated image counts.', flush=True)
    return sku_images


# ── PHASE 3: MATCH SKUs TO DATABASE PRODUCTS ──────────────────────

def get_db_products(conn):
    """Get all products from the database."""
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.sku, p.name, b.name as brand
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
    """)
    products = {}
    for row in cur.fetchall():
        products[str(row[1])] = {
            'id': row[0],
            'sku': str(row[1]),
            'name': row[2],
            'brand': row[3],
        }
    return products


def match_products(db_products, sku_images):
    """Match scraped images to database products."""
    matched = {}
    unmatched_db = []

    for sku, product in db_products.items():
        if sku in sku_images:
            matched[sku] = {
                'product': product,
                'images': sku_images[sku],
            }
        else:
            unmatched_db.append(product)

    return matched, unmatched_db


# ── PHASE 4: DOWNLOAD AND UPLOAD IMAGES ───────────────────────────

def download_image(url, session):
    """Download an image and return bytes + content type."""
    try:
        resp = session.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        content_type = resp.headers.get('Content-Type', 'image/jpeg')
        data = resp.content
        if len(data) < MIN_IMAGE_SIZE:
            return None, None
        return data, content_type
    except Exception as e:
        return None, None


def upload_to_azure(blob_service, container_client, image_data, content_type, filename):
    """Upload image to Azure Blob Storage."""
    blob_name = f'{BLOB_FOLDER}/{filename}'
    blob_client = container_client.get_blob_client(blob_name)

    # Determine proper content type
    if 'webp' in content_type:
        ct = 'image/webp'
        ext = 'webp'
    elif 'png' in content_type:
        ct = 'image/png'
        ext = 'png'
    else:
        ct = 'image/jpeg'
        ext = 'jpg'

    blob_client.upload_blob(
        image_data,
        overwrite=True,
        content_settings=ContentSettings(
            content_type=ct,
            cache_control='public, max-age=31536000, immutable',
        ),
    )

    return blob_client.url, blob_name, ct, ext


def process_product_images(conn, container_client, blob_service, matched, session):
    """Download, upload, and create DB records for matched product images."""
    print('\n[Phase 4] Downloading and uploading images...', flush=True)

    cur = conn.cursor()
    total = len(matched)
    products_done = 0
    images_uploaded = 0
    errors = 0

    for sku, data in matched.items():
        product = data['product']
        image_paths = data['images']
        product_id = product['id']

        products_done += 1
        if products_done % 25 == 0 or products_done == total:
            print(f'  Products: {products_done}/{total} | Images uploaded: {images_uploaded}', flush=True)

        # Sort images: Default folder first, then lifestyle
        def sort_key(path):
            if '/Default/' in path:
                return 0
            elif '/Lifestyle' in path:
                return 1
            return 2
        image_paths.sort(key=sort_key)

        # Limit to 5 images per product max
        image_paths = image_paths[:5]

        for display_order, img_path in enumerate(image_paths):
            try:
                # Build high-res URL
                url = get_high_res_url(img_path)

                # Download
                image_data, content_type = download_image(url, session)
                if not image_data:
                    # Try original URL
                    url = get_original_url(img_path)
                    image_data, content_type = download_image(url, session)
                if not image_data:
                    errors += 1
                    continue

                # Generate unique filename
                file_uuid = str(uuid.uuid4())
                ext = 'webp' if 'webp' in (content_type or '') else 'jpg'
                filename = f'{file_uuid}.{ext}'

                # Upload to Azure Blob Storage
                blob_url, blob_key, ct, ext = upload_to_azure(
                    blob_service, container_client, image_data, content_type, filename
                )

                # Create media_assets record
                cur.execute('''
                    INSERT INTO media_assets (
                        id, key, folder, filename, "mimeType", "sizeBytes",
                        "altText", "isDeleted", "createdAt", "updatedAt"
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, false, NOW(), NOW())
                ''', (
                    file_uuid,
                    f'{BLOB_FOLDER}/{filename}',
                    BLOB_FOLDER,
                    filename,
                    ct,
                    len(image_data),
                    product['name'],
                ))

                # Create product_images record
                is_primary = (display_order == 0)
                cur.execute("""
                    INSERT INTO product_images (
                        product_id, media_asset_id, alt_text,
                        display_order, is_primary, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                """, (
                    product_id,
                    file_uuid,
                    product['name'],
                    display_order,
                    is_primary,
                ))

                images_uploaded += 1

                # Rate limit downloads
                time.sleep(0.5)

            except Exception as e:
                print(f'  Error for SKU {sku} image {display_order}: {e}', flush=True)
                conn.rollback()
                errors += 1
                continue

        # Commit every product
        conn.commit()

    print(f'\n  Total images uploaded: {images_uploaded}', flush=True)
    print(f'  Errors: {errors}', flush=True)
    return images_uploaded, errors


# ── PHASE 5: VERIFY ───────────────────────────────────────────────

def verify(conn):
    """Verify loaded images."""
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM product_images")
    total_images = cur.fetchone()[0]

    cur.execute("SELECT COUNT(DISTINCT product_id) FROM product_images")
    products_with_images = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM products")
    total_products = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM media_assets WHERE folder = 'products'")
    media_assets = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) as img_count, COUNT(*) 
        FROM product_images 
        GROUP BY product_id 
        ORDER BY img_count DESC LIMIT 1
    """)
    max_row = cur.fetchone()
    max_images = max_row[0] if max_row else 0

    print(f'\n{"="*60}', flush=True)
    print(f'VERIFICATION', flush=True)
    print(f'{"="*60}', flush=True)
    print(f'Total products: {total_products}', flush=True)
    print(f'Products WITH images: {products_with_images}', flush=True)
    print(f'Products WITHOUT images: {total_products - products_with_images}', flush=True)
    print(f'Total product_images records: {total_images}', flush=True)
    print(f'Total media_assets: {media_assets}', flush=True)
    print(f'Max images per product: {max_images}', flush=True)
    
    cur.execute("""
        SELECT pi_count, COUNT(*) as product_count
        FROM (
            SELECT product_id, COUNT(*) as pi_count
            FROM product_images
            GROUP BY product_id
        ) sub
        GROUP BY pi_count
        ORDER BY pi_count
    """)
    print(f'\nImage count distribution:', flush=True)
    for count, products in cur.fetchall():
        print(f'  {count} image(s): {products} products', flush=True)


# ── MAIN ──────────────────────────────────────────────────────────

def main():
    print('=' * 60, flush=True)
    print('PRODUCT IMAGE SCRAPER & LOADER', flush=True)
    print('=' * 60, flush=True)

    session = requests.Session()

    # Check for resumed progress
    progress = load_progress()
    sku_images = None
    product_page_urls = {}

    if progress and progress.get('phase') == 'scraping_done':
        print('\nResuming from saved progress (scraping already done)...', flush=True)
        sku_images = progress['sku_images']
        product_page_urls = progress.get('product_page_urls', {})
    else:
        # Phase 1: Get category URLs
        category_urls = get_category_urls(session)

        # Phase 2: Scrape category pages
        sku_images, product_page_urls = scrape_category_pages(category_urls, session)

        # Save progress
        save_progress({
            'phase': 'scraping_done',
            'sku_images': sku_images,
            'product_page_urls': product_page_urls,
        })

    # Phase 3: Match to database
    print('\n[Phase 3] Matching to database products...', flush=True)
    conn = psycopg2.connect(**DB_CONFIG)
    db_products = get_db_products(conn)
    print(f'  Database products: {len(db_products)}', flush=True)

    matched, unmatched = match_products(db_products, sku_images)
    print(f'  Matched (have images): {len(matched)}', flush=True)
    print(f'  Unmatched (no images found): {len(unmatched)}', flush=True)

    if unmatched:
        print(f'  Sample unmatched SKUs:', flush=True)
        for p in unmatched[:10]:
            print(f'    {p["sku"]} - {p["name"][:60]}', flush=True)

    # Phase 2b: Scrape product detail pages for more images
    sku_images = scrape_product_pages(
        set(db_products.keys()), sku_images, product_page_urls, session
    )
    # Re-match after getting more images
    matched, unmatched = match_products(db_products, sku_images)

    if not matched:
        print('\nNo products matched! Exiting.', flush=True)
        conn.close()
        return

    # Phase 4: Download, upload, and create DB records
    print(f'\n[Phase 4] Setting up Azure Blob Storage...', flush=True)
    blob_service = BlobServiceClient.from_connection_string(AZURE_CONN_STR)
    container_client = blob_service.get_container_client(CONTAINER)

    # Filter matched to products that have NO images yet (do not delete existing rows)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT product_id FROM product_images")
    products_with_images_set = {row[0] for row in cur.fetchall()}
    before_filter = len(matched)
    matched = {sku: data for sku, data in matched.items()
               if data['product']['id'] not in products_with_images_set}
    print(f'  Filtered out {before_filter - len(matched)} products that already have images. Remaining to process: {len(matched)}', flush=True)

    images_uploaded, errors = process_product_images(
        conn, container_client, blob_service, matched, session
    )

    # Phase 5: Verify
    verify(conn)

    conn.close()

    # Save final stats
    save_progress({
        'phase': 'complete',
        'matched': len(matched),
        'unmatched': len(unmatched),
        'images_uploaded': images_uploaded,
        'errors': errors,
        'timestamp': datetime.now().isoformat(),
    })

    print(f'\n{"="*60}', flush=True)
    print('DONE', flush=True)
    print(f'{"="*60}', flush=True)


if __name__ == '__main__':
    main()

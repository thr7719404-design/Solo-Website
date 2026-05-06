import os
import psycopg2

password = os.environ.get('PGPASSWORD')
if not password:
    raise SystemExit('PGPASSWORD env var is required.')

conn = psycopg2.connect(
    host='pg-qlyb5greec2io.postgres.database.azure.com',
    port=5432, dbname='solo_ecommerce',
    user='soloadmin', password=password,
    sslmode='require'
)
cur = conn.cursor()

cur.execute('SELECT COUNT(*) FROM media_assets')
print('Total media_assets:', cur.fetchone()[0])

cur.execute('SELECT COUNT(*) FROM product_images')
print('Total product_images:', cur.fetchone()[0])

# Sample media_assets
cur.execute("""SELECT id, key, folder, filename, "mimeType", "sizeBytes" FROM media_assets ORDER BY "createdAt" DESC LIMIT 5""")
print('\nSample media_assets:')
for row in cur.fetchall():
    print(f'  id={row[0]}, key={row[1]}, folder={row[2]}, file={row[3]}, mime={row[4]}, size={row[5]}')

# Sample product_images
cur.execute("""
    SELECT pi.id, pi.product_id, pi.media_asset_id, pi.image_url, pi.image_type,
           pi.display_order, pi.is_primary, pi.alt_text
    FROM product_images pi
    ORDER BY pi.id DESC LIMIT 5
""")
print('\nSample product_images:')
for row in cur.fetchall():
    print(f'  pi_id={row[0]}, prod_id={row[1]}, asset_id={row[2]}, url={row[3][:150] if row[3] else None}')
    print(f'    type={row[4]}, order={row[5]}, primary={row[6]}, alt={row[7]}')

# Products with images vs without
cur.execute('SELECT COUNT(DISTINCT product_id) FROM product_images')
print(f'\nProducts with images: {cur.fetchone()[0]}')
cur.execute('SELECT COUNT(*) FROM products')
print(f'Total products: {cur.fetchone()[0]}')

# Check image_url patterns
cur.execute("""SELECT SUBSTRING(image_url FROM 1 FOR 80) as prefix, COUNT(*) FROM product_images WHERE image_url IS NOT NULL GROUP BY prefix ORDER BY COUNT(*) DESC LIMIT 10""")
print('\nimage_url patterns:')
for row in cur.fetchall():
    print(f'  {row[0]}... : {row[1]}')

# Check media_asset key patterns
cur.execute("""SELECT SUBSTRING(key FROM 1 FOR 60) as prefix, COUNT(*) FROM media_assets WHERE key IS NOT NULL GROUP BY prefix ORDER BY COUNT(*) DESC LIMIT 10""")
print('\nmedia_asset key patterns:')
for row in cur.fetchall():
    print(f'  {row[0]}... : {row[1]}')

# Check if product_images have media_asset_id or image_url or both
cur.execute("SELECT COUNT(*) FROM product_images WHERE media_asset_id IS NOT NULL")
print(f'\nWith media_asset_id: {cur.fetchone()[0]}')
cur.execute("SELECT COUNT(*) FROM product_images WHERE image_url IS NOT NULL")
print(f'With image_url: {cur.fetchone()[0]}')
cur.execute("SELECT COUNT(*) FROM product_images WHERE media_asset_id IS NOT NULL AND image_url IS NOT NULL")
print(f'With both: {cur.fetchone()[0]}')

conn.close()

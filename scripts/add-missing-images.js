const { BlobServiceClient } = require('@azure/storage-blob');
const pg = require('pg');
const https = require('https');
const http = require('http');
const { randomUUID } = require('crypto');

const AZURE_CONN_STR = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const CONTAINER = 'media';
const DB_URL = process.env.DATABASE_URL || '';

// Replacement images for the 4 that 404'd
const REPLACEMENTS = [
  { productId: 5,  name: 'Pyrex Glass Baking Dish Set',         url: 'https://images.pexels.com/photos/3184188/pexels-photo-3184188.jpeg?auto=compress&cs=tinysrgb&w=800', displayOrder: 0 },
  { productId: 6,  name: 'Pyrex Mixing Bowl Set',               url: 'https://images.pexels.com/photos/4033214/pexels-photo-4033214.jpeg?auto=compress&cs=tinysrgb&w=800', displayOrder: 0 },
  { productId: 12, name: 'Pyrex Storage Set 18-Piece',          url: 'https://images.pexels.com/photos/4397835/pexels-photo-4397835.jpeg?auto=compress&cs=tinysrgb&w=800', displayOrder: 0 },
  { productId: 13, name: 'Joseph Joseph Nest Lock Containers',  url: 'https://images.pexels.com/photos/4397921/pexels-photo-4397921.jpeg?auto=compress&cs=tinysrgb&w=800', displayOrder: 1 },
];

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const follow = (u, depth = 0) => {
      if (depth > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, depth + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

(async () => {
  const blobClient = BlobServiceClient.fromConnectionString(AZURE_CONN_STR);
  const containerClient = blobClient.getContainerClient(CONTAINER);
  const pool = new pg.Pool({ connectionString: DB_URL });
  const client = await pool.connect();

  for (const r of REPLACEMENTS) {
    const uuid = randomUUID();
    const blobPath = `products/${uuid}.jpeg`;
    try {
      process.stdout.write(`Product ${r.productId} (${r.name}): downloading...`);
      const buffer = await downloadImage(r.url);
      process.stdout.write(` ${(buffer.length / 1024).toFixed(0)}KB -> uploading...`);
      const blockBlob = containerClient.getBlockBlobClient(blobPath);
      await blockBlob.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: 'image/jpeg', blobCacheControl: 'public, max-age=31536000, immutable' },
      });
      const blobUrl = blockBlob.url;
      process.stdout.write(' -> DB...');
      await client.query(
        `INSERT INTO product_images (product_id, media_asset_id, alt_text, display_order, is_primary, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NOW(), NOW())`,
        [r.productId, blobUrl, `${r.name} - Extra`, r.displayOrder]
      );
      console.log(' OK', blobUrl);
    } catch (err) {
      console.log(' FAILED:', err.message);
    }
  }

  // Final count
  const { rows } = await client.query(
    'SELECT p.id, p.name, COUNT(pi.id) as img_count FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id GROUP BY p.id, p.name ORDER BY p.id'
  );
  console.log('\nFinal per-product image counts:');
  for (const row of rows) {
    console.log(`  Product ${row.id}: ${row.name} - ${row.img_count} images`);
  }

  client.release();
  await pool.end();
})();

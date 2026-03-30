/**
 * Populate product images from Pexels (free stock photos).
 *
 * Downloads images, uploads to Azure Blob Storage, then inserts
 * product_images rows directly into the database.
 *
 * Usage:  cd backend && node ../scripts/populate-product-images.js
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const pg = require('pg');
const https = require('https');
const http = require('http');
const { randomUUID } = require('crypto');

// ── Config ──────────────────────────────────────────────────────────
const AZURE_CONN_STR = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const CONTAINER = 'media';

const DB_URL = process.env.DATABASE_URL || '';

// ── Pexels image URLs (curated, copyright-free photos) ──────────────
const PRODUCT_INFO = {
  1:  'Le Creuset Dutch Oven 5.5 Qt',
  2:  'Le Creuset Skillet 10.25"',
  3:  'All-Clad D5 Fry Pan 12"',
  4:  'Lodge Cast Iron Skillet 12"',
  5:  'Pyrex Glass Baking Dish Set',
  6:  'Pyrex Mixing Bowl Set',
  7:  'OXO Good Grips 15-Piece Set',
  8:  'OXO Salad Spinner',
  9:  'Joseph Joseph Nest Utensils',
  10: 'Le Creuset Mug Set',
  11: 'Joseph Joseph Drink Bottle',
  12: 'Pyrex Storage Set 18-Piece',
  13: 'Joseph Joseph Nest Lock Containers',
  14: 'OXO POP Container Set',
  15: 'KitchenAid Artisan Stand Mixer',
  16: 'KitchenAid Hand Mixer',
  17: 'Cuisinart Food Processor 14-Cup',
  18: 'Cuisinart Immersion Blender',
  19: 'Lodge Camp Dutch Oven',
  20: 'Joseph Joseph Picnic Set',
};

const IMAGE_URLS = {
  1: [ // Le Creuset Dutch Oven
    'https://images.pexels.com/photos/2544829/pexels-photo-2544829.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4252137/pexels-photo-4252137.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6605305/pexels-photo-6605305.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  2: [ // Le Creuset Skillet
    'https://images.pexels.com/photos/4057693/pexels-photo-4057693.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3640451/pexels-photo-3640451.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6249501/pexels-photo-6249501.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  3: [ // All-Clad Fry Pan
    'https://images.pexels.com/photos/4259140/pexels-photo-4259140.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3662103/pexels-photo-3662103.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/8753901/pexels-photo-8753901.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  4: [ // Lodge Cast Iron Skillet
    'https://images.pexels.com/photos/4551832/pexels-photo-4551832.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5907528/pexels-photo-5907528.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5677794/pexels-photo-5677794.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  5: [ // Pyrex Glass Baking Dish Set
    'https://images.pexels.com/photos/5765820/pexels-photo-5765820.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4033636/pexels-photo-4033636.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3992134/pexels-photo-3992134.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  6: [ // Pyrex Mixing Bowl Set
    'https://images.pexels.com/photos/5765770/pexels-photo-5765770.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6287295/pexels-photo-6287295.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4033001/pexels-photo-4033001.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  7: [ // OXO Good Grips 15-Piece Set
    'https://images.pexels.com/photos/4226870/pexels-photo-4226870.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4226805/pexels-photo-4226805.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6996157/pexels-photo-6996157.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  8: [ // OXO Salad Spinner
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1580466/pexels-photo-1580466.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  9: [ // Joseph Joseph Nest Utensils
    'https://images.pexels.com/photos/4226873/pexels-photo-4226873.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4226896/pexels-photo-4226896.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  10: [ // Le Creuset Mug Set
    'https://images.pexels.com/photos/1493088/pexels-photo-1493088.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1727123/pexels-photo-1727123.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2396220/pexels-photo-2396220.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  11: [ // Joseph Joseph Drink Bottle
    'https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4065891/pexels-photo-4065891.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3621168/pexels-photo-3621168.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  12: [ // Pyrex Storage Set 18-Piece
    'https://images.pexels.com/photos/5765774/pexels-photo-5765774.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4397920/pexels-photo-4397920.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4033326/pexels-photo-4033326.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  13: [ // Joseph Joseph Nest Lock Containers
    'https://images.pexels.com/photos/4397919/pexels-photo-4397919.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5765772/pexels-photo-5765772.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  14: [ // OXO POP Container Set
    'https://images.pexels.com/photos/4397923/pexels-photo-4397923.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6957752/pexels-photo-6957752.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4033636/pexels-photo-4033636.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  15: [ // KitchenAid Artisan Stand Mixer
    'https://images.pexels.com/photos/4686818/pexels-photo-4686818.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4686961/pexels-photo-4686961.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6287520/pexels-photo-6287520.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  16: [ // KitchenAid Hand Mixer
    'https://images.pexels.com/photos/4686816/pexels-photo-4686816.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3992201/pexels-photo-3992201.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6287521/pexels-photo-6287521.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  17: [ // Cuisinart Food Processor
    'https://images.pexels.com/photos/4397917/pexels-photo-4397917.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3338497/pexels-photo-3338497.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6287488/pexels-photo-6287488.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  18: [ // Cuisinart Immersion Blender
    'https://images.pexels.com/photos/1907642/pexels-photo-1907642.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4033001/pexels-photo-4033001.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5907547/pexels-photo-5907547.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  19: [ // Lodge Camp Dutch Oven
    'https://images.pexels.com/photos/6605313/pexels-photo-6605313.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2526025/pexels-photo-2526025.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1309593/pexels-photo-1309593.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  // Product 20 already has images — skip
};

// ── Helpers ─────────────────────────────────────────────────────────

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const follow = (u, depth = 0) => {
      if (depth > 5) return reject(new Error(`Too many redirects for ${url}`));
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, depth + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Product Image Population Script ===\n');

  // Connect to Azure Blob
  const blobClient = BlobServiceClient.fromConnectionString(AZURE_CONN_STR);
  const containerClient = blobClient.getContainerClient(CONTAINER);
  console.log(`Connected to Azure Blob Storage (container: ${CONTAINER})`);

  // Connect to PostgreSQL
  const pool = new pg.Pool({ connectionString: DB_URL });
  const client = await pool.connect();
  console.log('Connected to PostgreSQL\n');

  let totalUploaded = 0;
  let totalFailed = 0;

  for (const [productIdStr, urls] of Object.entries(IMAGE_URLS)) {
    const productId = parseInt(productIdStr);
    const productName = PRODUCT_INFO[productId] || `Product ${productId}`;

    if (!urls || urls.length === 0) {
      console.log(`SKIP Product ${productId} (${productName}) — no URLs`);
      continue;
    }

    console.log(`\nProduct ${productId}: ${productName}`);

    // Check if product already has images
    const { rows: existingImages } = await client.query(
      'SELECT COUNT(*) as cnt FROM product_images WHERE product_id = $1',
      [productId]
    );

    if (parseInt(existingImages[0].cnt) > 0) {
      console.log(`  Already has ${existingImages[0].cnt} image(s) — skipping`);
      continue;
    }

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const isPrimary = i === 0;
      const uuid = randomUUID();
      const blobPath = `products/${uuid}.jpeg`;

      try {
        // Download image
        process.stdout.write(`  Image ${i + 1}/${urls.length}: downloading...`);
        const buffer = await downloadImage(url);
        process.stdout.write(` ${(buffer.length / 1024).toFixed(0)}KB`);

        // Upload to Azure Blob
        process.stdout.write(' -> uploading...');
        const blockBlob = containerClient.getBlockBlobClient(blobPath);
        await blockBlob.uploadData(buffer, {
          blobHTTPHeaders: {
            blobContentType: 'image/jpeg',
            blobCacheControl: 'public, max-age=31536000, immutable',
          },
        });
        const blobUrl = blockBlob.url;
        process.stdout.write(' -> saving to DB...');

        // Insert product_images row
        await client.query(
          `INSERT INTO product_images (product_id, media_asset_id, alt_text, display_order, is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [productId, blobUrl, `${productName} - Image ${i + 1}`, i, isPrimary]
        );

        console.log(` OK ${blobUrl}`);
        totalUploaded++;
      } catch (err) {
        console.log(` FAILED: ${err.message}`);
        totalFailed++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Done! Uploaded ${totalUploaded} images, ${totalFailed} failures`);

  // Verify
  const { rows: [{ count: imgCount }] } = await client.query('SELECT COUNT(*) as count FROM product_images');
  const { rows: productCounts } = await client.query(
    'SELECT p.id, p.name, COUNT(pi.id) as img_count FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id GROUP BY p.id, p.name ORDER BY p.id'
  );
  console.log(`\nTotal product_images rows: ${imgCount}`);
  console.log('\nPer-product image counts:');
  for (const row of productCounts) {
    const status = parseInt(row.img_count) > 0 ? 'OK' : 'MISSING';
    console.log(`  [${status}] Product ${row.id}: ${row.name} — ${row.img_count} images`);
  }

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});

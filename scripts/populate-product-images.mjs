/**
 * Populate product images from Pexels (free stock photos).
 *
 * Downloads images, uploads to Azure Blob Storage, then inserts
 * product_images rows directly into the database.
 *
 * Usage:  node scripts/populate-product-images.mjs
 */

import { BlobServiceClient } from '@azure/storage-blob';
import pg from 'pg';
import https from 'https';
import { randomUUID } from 'crypto';
import path from 'path';

// ── Config ──────────────────────────────────────────────────────────
const AZURE_CONN_STR = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const CONTAINER = 'media';

const DB_URL = process.env.DATABASE_URL || '';

// ── Product → image search terms (2-3 per product) ─────────────────
// Pexels curated search queries matched to each product
const PRODUCT_IMAGES = {
  1: { name: 'Le Creuset Dutch Oven 5.5 Qt', queries: ['dutch oven cooking', 'red dutch oven kitchen', 'cast iron pot food'] },
  2: { name: 'Le Creuset Skillet 10.25"', queries: ['cast iron skillet cooking', 'red skillet kitchen', 'skillet searing food'] },
  3: { name: 'All-Clad D5 Fry Pan 12"', queries: ['stainless steel frying pan', 'stainless pan cooking', 'fry pan kitchen'] },
  4: { name: 'Lodge Cast Iron Skillet 12"', queries: ['lodge cast iron skillet', 'cast iron pan campfire', 'cast iron skillet breakfast'] },
  5: { name: 'Pyrex Glass Baking Dish Set', queries: ['glass baking dish', 'pyrex baking casserole', 'glass bakeware set'] },
  6: { name: 'Pyrex Mixing Bowl Set', queries: ['glass mixing bowls', 'mixing bowl set kitchen', 'colorful mixing bowls baking'] },
  7: { name: 'OXO Good Grips 15-Piece Set', queries: ['kitchen utensil set', 'cooking utensils organized', 'kitchen tools set'] },
  8: { name: 'OXO Salad Spinner', queries: ['salad spinner kitchen', 'washing lettuce kitchen', 'fresh salad preparation'] },
  9: { name: 'Joseph Joseph Nest Utensils', queries: ['modern kitchen utensils', 'colorful kitchen tools', 'nesting kitchen utensils'] },
  10: { name: 'Le Creuset Mug Set', queries: ['colorful ceramic mugs', 'coffee mug set kitchen', 'stoneware mugs collection'] },
  11: { name: 'Joseph Joseph Drink Bottle', queries: ['water bottle modern', 'sport drink bottle', 'reusable water bottle'] },
  12: { name: 'Pyrex Storage Set 18-Piece', queries: ['glass food containers', 'meal prep containers', 'glass food storage kitchen'] },
  13: { name: 'Joseph Joseph Nest Lock Containers', queries: ['food storage containers colorful', 'nested food containers', 'kitchen storage containers'] },
  14: { name: 'OXO POP Container Set', queries: ['airtight food containers', 'pantry storage containers', 'dry food storage jars'] },
  15: { name: 'KitchenAid Artisan Stand Mixer', queries: ['stand mixer kitchen', 'kitchenaid mixer baking', 'red stand mixer'] },
  16: { name: 'KitchenAid Hand Mixer', queries: ['hand mixer baking', 'electric hand mixer', 'hand mixer kitchen'] },
  17: { name: 'Cuisinart Food Processor 14-Cup', queries: ['food processor kitchen', 'food processor chopping', 'food processor vegetables'] },
  18: { name: 'Cuisinart Immersion Blender', queries: ['immersion blender soup', 'hand blender kitchen', 'immersion blender cooking'] },
  19: { name: 'Lodge Camp Dutch Oven', queries: ['camp dutch oven fire', 'outdoor cast iron cooking', 'campfire dutch oven'] },
  20: { name: 'Joseph Joseph Picnic Set', queries: ['picnic set outdoor', 'modern picnic accessories', 'outdoor dining set'] },
};

// ── Pexels image URLs (curated, copyright-free photos) ──────────────
// Pre-selected high-quality Pexels photos for each product type
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
  20: [ // Joseph Joseph Picnic Set (already has images, skip)
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const follow = (u, depth = 0) => {
      if (depth > 5) return reject(new Error(`Too many redirects for ${url}`));
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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
  console.log(`✓ Connected to Azure Blob Storage (container: ${CONTAINER})`);

  // Connect to PostgreSQL
  const pool = new pg.Pool({ connectionString: DB_URL });
  const client = await pool.connect();
  console.log('✓ Connected to PostgreSQL\n');

  // Get the max existing product_images id for new inserts
  const { rows: [{ max: maxId }] } = await client.query('SELECT COALESCE(MAX(id), 0) as max FROM product_images');
  let nextId = parseInt(maxId) + 1;

  let totalUploaded = 0;
  let totalFailed = 0;

  for (const [productIdStr, urls] of Object.entries(IMAGE_URLS)) {
    const productId = parseInt(productIdStr);
    const productInfo = PRODUCT_IMAGES[productId];

    if (!urls || urls.length === 0) {
      console.log(`⏭  Product ${productId} (${productInfo.name}) — skipping (already has images)`);
      continue;
    }

    console.log(`\n📦 Product ${productId}: ${productInfo.name}`);

    // Check if product already has images
    const { rows: existingImages } = await client.query(
      'SELECT COUNT(*) as cnt FROM product_images WHERE product_id = $1',
      [productId]
    );

    if (parseInt(existingImages[0].cnt) > 0) {
      console.log(`  ⏭  Already has ${existingImages[0].cnt} image(s) — skipping`);
      continue;
    }

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const isPrimary = i === 0;
      const uuid = randomUUID();
      const ext = 'jpeg';
      const blobFilename = `${uuid}.${ext}`;
      const blobPath = `products/${blobFilename}`;

      try {
        // Download image
        process.stdout.write(`  📥 Image ${i + 1}/${urls.length}: downloading...`);
        const buffer = await downloadImage(url);
        process.stdout.write(` ${(buffer.length / 1024).toFixed(0)}KB`);

        // Upload to Azure Blob
        process.stdout.write(' → uploading...');
        const blockBlob = containerClient.getBlockBlobClient(blobPath);
        await blockBlob.uploadData(buffer, {
          blobHTTPHeaders: {
            blobContentType: 'image/jpeg',
            blobCacheControl: 'public, max-age=31536000, immutable',
          },
        });
        const blobUrl = blockBlob.url;
        process.stdout.write(' → saving to DB...');

        // Insert product_images row
        await client.query(
          `INSERT INTO product_images (product_id, media_asset_id, alt_text, display_order, is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [productId, blobUrl, `${productInfo.name} - Image ${i + 1}`, i, isPrimary]
        );

        console.log(` ✅ ${blobUrl}`);
        totalUploaded++;
      } catch (err) {
        console.log(` ❌ FAILED: ${err.message}`);
        totalFailed++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Done! Uploaded ${totalUploaded} images, ${totalFailed} failures`);

  // Verify
  const { rows: [{ count: imgCount }] } = await client.query('SELECT COUNT(*) as count FROM product_images');
  const { rows: productCounts } = await client.query(
    'SELECT p.id, p.name, COUNT(pi.id) as img_count FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id GROUP BY p.id, p.name ORDER BY p.id'
  );
  console.log(`\nTotal product_images rows: ${imgCount}`);
  console.log('\nPer-product image counts:');
  for (const row of productCounts) {
    const status = parseInt(row.img_count) > 0 ? '✅' : '❌';
    console.log(`  ${status} Product ${row.id}: ${row.name} — ${row.img_count} images`);
  }

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});

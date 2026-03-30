/**
 * Inventory Schema Migration Script
 * 
 * Migrates ALL inventory_db tables/data into solo_ecommerce.inventory schema
 * Uses postgres_fdw for cross-database data transfer
 * 
 * This script is IDEMPOTENT - safe to run multiple times
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SOLO_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/solo_ecommerce';
const INVENTORY_DB_URL = process.env.INVENTORY_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inventory_db';

// Parse connection info from INVENTORY_DATABASE_URL for FDW
function parseDbUrl(url: string) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error(`Invalid database URL: ${url}`);
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

// Tables to migrate (in order due to FK dependencies)
const INVENTORY_TABLES = [
  'countries',
  'brands',
  'designers',
  'categories',
  'subcategories',
  'products',
  'product_dimensions',
  'product_packaging',
  'product_pricing',
  'product_images',
  'product_specifications',
  'inventory_transactions',
];

async function main() {
  console.log('🚀 Starting Inventory Schema Migration...\n');
  
  const soloClient = new Client({ connectionString: SOLO_DB_URL });
  const invConfig = parseDbUrl(INVENTORY_DB_URL);
  
  try {
    await soloClient.connect();
    console.log('✅ Connected to solo_ecommerce database\n');

    // Step 1: Create inventory schema
    console.log('📁 Step 1: Creating inventory schema...');
    await soloClient.query(`CREATE SCHEMA IF NOT EXISTS inventory;`);
    console.log('   ✅ Schema "inventory" created/exists\n');

    // Step 2: Set up postgres_fdw for cross-database access
    console.log('🔗 Step 2: Setting up postgres_fdw...');
    await soloClient.query(`CREATE EXTENSION IF NOT EXISTS postgres_fdw;`);
    
    // Drop existing server if exists (for idempotency)
    await soloClient.query(`DROP SERVER IF EXISTS inventory_fdw_server CASCADE;`);
    
    await soloClient.query(`
      CREATE SERVER inventory_fdw_server
      FOREIGN DATA WRAPPER postgres_fdw
      OPTIONS (host '${invConfig.host}', dbname '${invConfig.database}', port '${invConfig.port}');
    `);
    
    await soloClient.query(`
      CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
      SERVER inventory_fdw_server
      OPTIONS (user '${invConfig.user}', password '${invConfig.password}');
    `);
    
    // Create a temporary schema for foreign tables
    await soloClient.query(`DROP SCHEMA IF EXISTS inventory_fdw CASCADE;`);
    await soloClient.query(`CREATE SCHEMA inventory_fdw;`);
    
    await soloClient.query(`
      IMPORT FOREIGN SCHEMA public
      FROM SERVER inventory_fdw_server
      INTO inventory_fdw;
    `);
    console.log('   ✅ Foreign data wrapper configured\n');

    // Step 3: Create tables in inventory schema (matching inventory_db structure)
    console.log('📋 Step 3: Creating tables in inventory schema...');
    
    // Drop existing tables in reverse order (to handle FK dependencies)
    for (const table of [...INVENTORY_TABLES].reverse()) {
      await soloClient.query(`DROP TABLE IF EXISTS inventory.${table} CASCADE;`);
    }

    // Create countries table
    await soloClient.query(`
      CREATE TABLE inventory.countries (
        id SERIAL PRIMARY KEY,
        country_code VARCHAR(3) UNIQUE NOT NULL,
        country_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_countries_code ON inventory.countries(country_code);
    `);

    // Create brands table
    await soloClient.query(`
      CREATE TABLE inventory.brands (
        id SERIAL PRIMARY KEY,
        brand_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        website VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_brands_name ON inventory.brands(brand_name);
      CREATE INDEX idx_inv_brands_active ON inventory.brands(is_active);
    `);

    // Create designers table
    await soloClient.query(`
      CREATE TABLE inventory.designers (
        id SERIAL PRIMARY KEY,
        designer_name VARCHAR(100) UNIQUE NOT NULL,
        bio TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_designers_name ON inventory.designers(designer_name);
    `);

    // Create categories table
    await soloClient.query(`
      CREATE TABLE inventory.categories (
        id SERIAL PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_categories_name ON inventory.categories(category_name);
      CREATE INDEX idx_inv_categories_active ON inventory.categories(is_active);
    `);

    // Create subcategories table
    await soloClient.query(`
      CREATE TABLE inventory.subcategories (
        id SERIAL PRIMARY KEY,
        category_id INT REFERENCES inventory.categories(id) ON DELETE CASCADE,
        subcategory_name VARCHAR(100) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(category_id, subcategory_name)
      );
      CREATE INDEX idx_inv_subcategories_category ON inventory.subcategories(category_id);
      CREATE INDEX idx_inv_subcategories_name ON inventory.subcategories(subcategory_name);
    `);

    // Create products table
    await soloClient.query(`
      CREATE TABLE inventory.products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        sku_2025 VARCHAR(50),
        sku_2026 VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        name_english VARCHAR(255),
        description TEXT,
        category_id INT REFERENCES inventory.categories(id) ON DELETE SET NULL,
        subcategory_id INT REFERENCES inventory.subcategories(id) ON DELETE SET NULL,
        brand_id INT REFERENCES inventory.brands(id) ON DELETE SET NULL,
        designer_id INT REFERENCES inventory.designers(id) ON DELETE SET NULL,
        country_id INT REFERENCES inventory.countries(id) ON DELETE SET NULL,
        material VARCHAR(255),
        colour VARCHAR(100),
        size VARCHAR(50),
        ean BIGINT,
        ean_secondary BIGINT,
        customs_tariff_number BIGINT,
        dishwasher_safe BOOLEAN,
        cleaning_maintenance TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_discontinued BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_new BOOLEAN DEFAULT FALSE,
        is_best_seller BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_products_sku ON inventory.products(sku);
      CREATE INDEX idx_inv_products_category ON inventory.products(category_id);
      CREATE INDEX idx_inv_products_brand ON inventory.products(brand_id);
      CREATE INDEX idx_inv_products_active ON inventory.products(is_active);
      CREATE INDEX idx_inv_products_featured ON inventory.products(is_featured);
      CREATE INDEX idx_inv_products_new ON inventory.products(is_new);
      CREATE INDEX idx_inv_products_bestseller ON inventory.products(is_best_seller);
    `);

    // Create product_dimensions table
    await soloClient.query(`
      CREATE TABLE inventory.product_dimensions (
        id SERIAL PRIMARY KEY,
        product_id INT UNIQUE REFERENCES inventory.products(id) ON DELETE CASCADE,
        functional_depth_cm DECIMAL(10,2),
        functional_width_cm DECIMAL(10,2),
        functional_height_cm DECIMAL(10,2),
        functional_diameter_cm DECIMAL(10,2),
        functional_capacity_liter DECIMAL(10,3),
        packed_weight_kg DECIMAL(10,3),
        packed_depth_cm DECIMAL(10,2),
        packed_width_cm DECIMAL(10,2),
        packed_height_cm DECIMAL(10,2),
        product_weight_kg DECIMAL(10,3),
        technical_capacity_liter DECIMAL(10,3),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_dimensions_product ON inventory.product_dimensions(product_id);
    `);

    // Create product_packaging table
    await soloClient.query(`
      CREATE TABLE inventory.product_packaging (
        id SERIAL PRIMARY KEY,
        product_id INT UNIQUE REFERENCES inventory.products(id) ON DELETE CASCADE,
        packaging_type VARCHAR(100),
        colli_size INT,
        colli_weight_kg DECIMAL(10,3),
        colli_length_cm DECIMAL(10,2),
        colli_width_cm DECIMAL(10,2),
        colli_height_cm DECIMAL(10,2),
        master_colli_weight_kg DECIMAL(10,3),
        master_colli_length_cm DECIMAL(10,2),
        master_colli_width_cm DECIMAL(10,2),
        master_colli_height_cm DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_packaging_product ON inventory.product_packaging(product_id);
    `);

    // Create product_pricing table
    await soloClient.query(`
      CREATE TABLE inventory.product_pricing (
        id SERIAL PRIMARY KEY,
        product_id INT UNIQUE REFERENCES inventory.products(id) ON DELETE CASCADE,
        rrp_aed_excl_vat DECIMAL(10,2),
        price_incl_vat DECIMAL(10,2),
        listed_price_incl_vat DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'AED',
        vat_rate DECIMAL(5,2),
        is_current BOOLEAN DEFAULT TRUE,
        effective_from DATE,
        effective_to DATE,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_pricing_product ON inventory.product_pricing(product_id);
    `);

    // Create product_images table
    await soloClient.query(`
      CREATE TABLE inventory.product_images (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES inventory.products(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        image_type VARCHAR(50),
        alt_text VARCHAR(255),
        display_order INT DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_images_product ON inventory.product_images(product_id);
      CREATE INDEX idx_inv_images_order ON inventory.product_images(display_order);
    `);

    // Create product_specifications table
    await soloClient.query(`
      CREATE TABLE inventory.product_specifications (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES inventory.products(id) ON DELETE CASCADE,
        spec_key VARCHAR(100) NOT NULL,
        spec_value TEXT,
        spec_unit VARCHAR(50),
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_inv_specs_product ON inventory.product_specifications(product_id);
    `);

    // Create inventory_transactions table
    await soloClient.query(`
      CREATE TABLE inventory.inventory_transactions (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES inventory.products(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        quantity_before INT NOT NULL,
        quantity_after INT NOT NULL,
        reference VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(100)
      );
      CREATE INDEX idx_inv_transactions_product ON inventory.inventory_transactions(product_id);
      CREATE INDEX idx_inv_transactions_type ON inventory.inventory_transactions(transaction_type);
      CREATE INDEX idx_inv_transactions_created ON inventory.inventory_transactions(created_at);
    `);
    
    console.log('   ✅ All tables created in inventory schema\n');

    // Step 4: Copy data from inventory_db via foreign tables
    console.log('📦 Step 4: Copying data from inventory_db...');
    
    for (const table of INVENTORY_TABLES) {
      try {
        // Check if source table has data
        const countResult = await soloClient.query(`SELECT COUNT(*) FROM inventory_fdw.${table};`);
        const sourceCount = parseInt(countResult.rows[0].count);
        
        if (sourceCount > 0) {
          // Copy data
          await soloClient.query(`INSERT INTO inventory.${table} SELECT * FROM inventory_fdw.${table};`);
          console.log(`   ✅ ${table}: ${sourceCount} rows copied`);
        } else {
          console.log(`   ⏭️  ${table}: 0 rows (empty source)`);
        }
      } catch (err: any) {
        console.error(`   ❌ ${table}: Error - ${err.message}`);
      }
    }
    console.log();

    // Step 5: Fix sequences (setval to max(id))
    console.log('🔢 Step 5: Fixing sequences...');
    
    for (const table of INVENTORY_TABLES) {
      try {
        const seqName = `inventory.${table}_id_seq`;
        const maxResult = await soloClient.query(`SELECT COALESCE(MAX(id), 0) as maxid FROM inventory.${table};`);
        const maxId = parseInt(maxResult.rows[0].maxid) || 0;
        
        if (maxId > 0) {
          await soloClient.query(`SELECT setval('${seqName}', ${maxId}, true);`);
          console.log(`   ✅ ${table}_id_seq set to ${maxId}`);
        }
      } catch (err: any) {
        // Sequence might not exist for some tables
        if (!err.message.includes('does not exist')) {
          console.error(`   ⚠️  ${table}: ${err.message}`);
        }
      }
    }
    console.log();

    // Step 6: Create views
    console.log('👁️ Step 6: Creating views...');
    
    // View: Complete product information
    await soloClient.query(`
      CREATE OR REPLACE VIEW inventory.vw_products_complete AS
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.name_english,
        p.description,
        p.material,
        p.colour,
        p.size,
        p.ean,
        p.is_active,
        p.is_discontinued,
        p.is_featured,
        p.is_new,
        p.is_best_seller,
        p.created_at,
        p.updated_at,
        c.id as category_id,
        c.category_name,
        sc.id as subcategory_id,
        sc.subcategory_name,
        b.id as brand_id,
        b.brand_name,
        d.id as designer_id,
        d.designer_name,
        co.id as country_id,
        co.country_name,
        co.country_code,
        pr.rrp_aed_excl_vat,
        pr.price_incl_vat,
        pr.listed_price_incl_vat,
        pr.currency,
        pr.vat_rate,
        dim.functional_depth_cm,
        dim.functional_width_cm,
        dim.functional_height_cm,
        dim.product_weight_kg
      FROM inventory.products p
      LEFT JOIN inventory.categories c ON p.category_id = c.id
      LEFT JOIN inventory.subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN inventory.brands b ON p.brand_id = b.id
      LEFT JOIN inventory.designers d ON p.designer_id = d.id
      LEFT JOIN inventory.countries co ON p.country_id = co.id
      LEFT JOIN inventory.product_pricing pr ON p.id = pr.product_id AND pr.is_current = TRUE
      LEFT JOIN inventory.product_dimensions dim ON p.id = dim.product_id;
    `);
    console.log('   ✅ vw_products_complete created');

    // View: Current inventory (placeholder - will need stock tracking)
    await soloClient.query(`
      CREATE OR REPLACE VIEW inventory.vw_current_inventory AS
      SELECT 
        p.id as product_id,
        p.sku,
        p.name,
        p.is_active,
        COALESCE(
          (SELECT SUM(
            CASE WHEN it.transaction_type IN ('PURCHASE', 'ADJUSTMENT_ADD', 'RETURN') THEN it.quantity
                 WHEN it.transaction_type IN ('SALE', 'ADJUSTMENT_REMOVE', 'DAMAGE') THEN -it.quantity
                 ELSE 0 
            END
          ) FROM inventory.inventory_transactions it WHERE it.product_id = p.id),
          0
        ) as current_stock,
        (SELECT MAX(created_at) FROM inventory.inventory_transactions it WHERE it.product_id = p.id) as last_transaction_at
      FROM inventory.products p
      WHERE p.is_active = TRUE;
    `);
    console.log('   ✅ vw_current_inventory created\n');

    // Step 7: Cleanup FDW
    console.log('🧹 Step 7: Cleaning up foreign data wrapper...');
    await soloClient.query(`DROP SCHEMA IF EXISTS inventory_fdw CASCADE;`);
    await soloClient.query(`DROP SERVER IF EXISTS inventory_fdw_server CASCADE;`);
    console.log('   ✅ FDW resources cleaned up\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nAll inventory data is now in solo_ecommerce.inventory schema');
    console.log('Run "npm run db:inventory:verify" to verify the migration');
    console.log();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await soloClient.end();
  }
}

main();

/**
 * Inventory Migration Verification Script
 * 
 * Compares row counts and sample data between:
 * - inventory_db (source)
 * - solo_ecommerce.inventory schema (target)
 * 
 * Run after migrate_inventory_schema.ts to verify data integrity
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SOLO_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/solo_ecommerce';
const INVENTORY_DB_URL = process.env.INVENTORY_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inventory_db';

// Tables to verify
const TABLES = [
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

interface VerificationResult {
  table: string;
  sourceCount: number;
  targetCount: number;
  match: boolean;
  sampleMatch?: boolean;
  error?: string;
}

async function main() {
  console.log('🔍 Starting Inventory Migration Verification...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const soloClient = new Client({ connectionString: SOLO_DB_URL });
  const invClient = new Client({ connectionString: INVENTORY_DB_URL });
  
  const results: VerificationResult[] = [];
  let allPassed = true;

  try {
    await soloClient.connect();
    await invClient.connect();
    console.log('✅ Connected to both databases\n');

    // Verify each table
    console.log('📊 Row Count Comparison:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(formatRow('Table', 'Source', 'Target', 'Status'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const table of TABLES) {
      try {
        // Count in source (inventory_db.public)
        const sourceResult = await invClient.query(`SELECT COUNT(*) FROM public.${table};`);
        const sourceCount = parseInt(sourceResult.rows[0].count);

        // Count in target (solo_ecommerce.inventory)
        const targetResult = await soloClient.query(`SELECT COUNT(*) FROM inventory.${table};`);
        const targetCount = parseInt(targetResult.rows[0].count);

        const match = sourceCount === targetCount;
        if (!match) allPassed = false;

        results.push({ table, sourceCount, targetCount, match });
        
        const status = match ? '✅ MATCH' : '❌ MISMATCH';
        console.log(formatRow(table, sourceCount.toString(), targetCount.toString(), status));
      } catch (err: any) {
        results.push({ 
          table, 
          sourceCount: -1, 
          targetCount: -1, 
          match: false,
          error: err.message 
        });
        console.log(formatRow(table, 'ERROR', 'ERROR', '❌ ' + err.message.substring(0, 20)));
        allPassed = false;
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Sample data verification for key tables
    console.log('🔎 Sample Data Verification:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Verify products sample
    const productSampleCheck = await verifySampleData(
      invClient, soloClient, 'products', 'sku', 3
    );
    console.log(`   Products: ${productSampleCheck ? '✅ Sample data matches' : '❌ Sample data mismatch'}`);

    // Verify categories sample
    const categorySampleCheck = await verifySampleData(
      invClient, soloClient, 'categories', 'category_name', 3
    );
    console.log(`   Categories: ${categorySampleCheck ? '✅ Sample data matches' : '❌ Sample data mismatch'}`);

    // Verify brands sample
    const brandsSampleCheck = await verifySampleData(
      invClient, soloClient, 'brands', 'brand_name', 3
    );
    console.log(`   Brands: ${brandsSampleCheck ? '✅ Sample data matches' : '❌ Sample data mismatch'}`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check views exist
    console.log('👁️ View Verification:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const viewCheck1 = await checkViewExists(soloClient, 'vw_products_complete');
    console.log(`   vw_products_complete: ${viewCheck1 ? '✅ Exists' : '❌ Missing'}`);
    
    const viewCheck2 = await checkViewExists(soloClient, 'vw_current_inventory');
    console.log(`   vw_current_inventory: ${viewCheck2 ? '✅ Exists' : '❌ Missing'}`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check schema exists
    console.log('📁 Schema Verification:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const schemaResult = await soloClient.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name = 'inventory';
    `);
    const schemaExists = schemaResult.rows.length > 0;
    console.log(`   inventory schema: ${schemaExists ? '✅ Exists in solo_ecommerce' : '❌ Missing'}`);

    // Count tables in inventory schema
    const tableCountResult = await soloClient.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'inventory' AND table_type = 'BASE TABLE';
    `);
    const tableCount = parseInt(tableCountResult.rows[0].count);
    console.log(`   Tables in schema: ${tableCount === TABLES.length ? '✅' : '⚠️'} ${tableCount}/${TABLES.length}`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    if (allPassed && viewCheck1 && viewCheck2 && schemaExists) {
      console.log('✅ VERIFICATION PASSED - All data migrated successfully!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\nYou can now:');
      console.log('1. Update Prisma schema to use inventory schema');
      console.log('2. Remove InventoryPrismaService');
      console.log('3. Update services to use single PrismaService');
      console.log('4. Remove INVENTORY_DATABASE_URL from .env');
    } else {
      console.log('❌ VERIFICATION FAILED - Please check the issues above');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\nPossible issues:');
      console.log('- Migration script may not have completed');
      console.log('- Source data may have changed since migration');
      console.log('- Database connection issues');
      process.exit(1);
    }
    console.log();

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await soloClient.end();
    await invClient.end();
  }
}

async function verifySampleData(
  sourceClient: Client,
  targetClient: Client,
  table: string,
  keyColumn: string,
  sampleSize: number
): Promise<boolean> {
  try {
    // Get sample IDs from source
    const sourceResult = await sourceClient.query(
      `SELECT id, ${keyColumn} FROM public.${table} ORDER BY id LIMIT ${sampleSize};`
    );
    
    if (sourceResult.rows.length === 0) return true; // Empty table is OK

    // Check each sample in target
    for (const row of sourceResult.rows) {
      const targetResult = await targetClient.query(
        `SELECT ${keyColumn} FROM inventory.${table} WHERE id = $1;`,
        [row.id]
      );
      
      if (targetResult.rows.length === 0) return false;
      if (targetResult.rows[0][keyColumn] !== row[keyColumn]) return false;
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

async function checkViewExists(client: Client, viewName: string): Promise<boolean> {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'inventory' AND table_name = $1
      );
    `, [viewName]);
    return result.rows[0].exists;
  } catch {
    return false;
  }
}

function formatRow(col1: string, col2: string, col3: string, col4: string): string {
  return `   ${col1.padEnd(25)} ${col2.padStart(8)} ${col3.padStart(8)}   ${col4}`;
}

main();

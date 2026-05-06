// One-off: apply the two new migration SQL files directly, then mark all
// pre-existing migrations in prisma/migrations as already applied so future
// `prisma migrate deploy` runs work cleanly.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'prisma', 'migrations');

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error('DATABASE_URL env var required');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });

const NEW_MIGRATIONS = ['20260208000000_remove_blog', '20260208000100_clean_nav'];

async function main() {
  await client.connect();
  console.log('Connected to prod DB.');

  // List all migration directories on disk in chronological order.
  const allDirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  console.log(`Found ${allDirs.length} migrations on disk.`);

  // Read which are already in _prisma_migrations.
  let appliedNames = new Set();
  try {
    const res = await client.query('SELECT migration_name FROM _prisma_migrations');
    appliedNames = new Set(res.rows.map((r) => r.migration_name));
    console.log(`_prisma_migrations has ${appliedNames.size} rows already.`);
  } catch (e) {
    console.log('_prisma_migrations table not found yet (expected).');
  }

  // Apply the two new migrations directly via SQL execution.
  for (const name of NEW_MIGRATIONS) {
    const sqlPath = join(migrationsDir, name, 'migration.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    console.log(`\n--- Applying ${name} ---`);
    try {
      await client.query(sql);
      console.log(`OK: ${name} executed`);
    } catch (e) {
      console.error(`FAIL ${name}:`, e.message);
      throw e;
    }
  }

  await client.end();

  // Now use prisma to mark all older migrations + the two new ones as applied.
  // We do this by running `prisma migrate resolve --applied <name>` for each
  // migration that is not yet in the history table.
  console.log('\n--- Marking all migrations as applied in _prisma_migrations ---');
  for (const name of allDirs) {
    if (appliedNames.has(name)) {
      console.log(`  skip (already tracked): ${name}`);
      continue;
    }
    console.log(`  resolving: ${name}`);
    try {
      execSync(`npx prisma migrate resolve --applied ${name}`, {
        stdio: 'inherit',
        cwd: join(__dirname, '..'),
        env: { ...process.env },
      });
    } catch (e) {
      console.error(`  resolve failed for ${name}:`, e.message);
    }
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

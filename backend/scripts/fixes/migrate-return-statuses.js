const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL env var is required. Set it before running this script.');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  // Migrate old statuses to new ones
  // PICKUP_SCHEDULED -> APPROVED (was between approved and picked_up)
  // ITEMS_RECEIVED -> PICKED_UP (items at warehouse = picked up)
  // QUALITY_CHECK -> QC
  // REFUND_PROCESSING -> CLOSED
  // COMPLETED -> CLOSED

  const migrations = [
    { from: 'PICKUP_SCHEDULED', to: 'APPROVED' },
    { from: 'ITEMS_RECEIVED', to: 'PICKED_UP' },
    { from: 'QUALITY_CHECK', to: 'QC' },
    { from: 'REFUND_PROCESSING', to: 'CLOSED' },
    { from: 'COMPLETED', to: 'CLOSED' },
  ];

  for (const { from, to } of migrations) {
    const result = await client.query(`UPDATE returns SET status = $1 WHERE status = $2`, [to, from]);
    if (result.rowCount > 0) {
      console.log(`Migrated ${result.rowCount} returns from ${from} -> ${to}`);
    }
  }

  // Verify
  const { rows } = await client.query(`SELECT id, "returnNumber", status FROM returns`);
  console.log('Returns after migration:', rows);

  await client.end();
}

main().catch(e => { console.error(e); client.end(); });

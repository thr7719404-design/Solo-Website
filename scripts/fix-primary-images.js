const pg = require('pg');
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL env var is required.');
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const c = await pool.connect();
  for (const pid of [5, 6, 12]) {
    const { rows } = await c.query(
      'SELECT id, display_order, is_primary FROM product_images WHERE product_id = $1 ORDER BY display_order',
      [pid]
    );
    console.log('Product', pid, ':', JSON.stringify(rows));
    if (rows.length > 0 && !rows.some(r => r.is_primary)) {
      await c.query('UPDATE product_images SET is_primary = true WHERE id = $1', [rows[0].id]);
      console.log('  Fixed: set image', rows[0].id, 'as primary');
    } else {
      console.log('  OK (already has primary)');
    }
  }
  c.release();
  await pool.end();
  console.log('Done');
})();

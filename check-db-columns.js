const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:SoloWebsite2025!@pg-qlyb5greec2io.postgres.database.azure.com/solo_ecommerce?sslmode=require'
    }
  }
});

async function main() {
  const cols = await p.$queryRawUnsafe(
    "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('brands','categories') ORDER BY table_name, ordinal_position"
  );
  console.log(JSON.stringify(cols, null, 2));
  
  // Also check if any brands have logo_id set
  const brands = await p.$queryRawUnsafe("SELECT id, name, logo_id FROM brands LIMIT 10");
  console.log('BRANDS:', JSON.stringify(brands, null, 2));
  
  // Check categories with image_id
  const cats = await p.$queryRawUnsafe("SELECT id, name, image_id FROM categories LIMIT 5");
  console.log('CATEGORIES:', JSON.stringify(cats, null, 2));
}

main().then(() => p.$disconnect()).catch(e => { console.error(e.message); p.$disconnect(); });

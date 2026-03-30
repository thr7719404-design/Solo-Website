const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();

(async () => {
  const invCategory = await p.invCategory.findMany({ orderBy: { id: 'asc' } });
  const invSubcategory = await p.invSubcategory.findMany({ orderBy: { id: 'asc' } });
  
  const out = {
    timestamp: new Date().toISOString(),
    invCategoryCount: invCategory.length,
    invSubcategoryCount: invSubcategory.length,
    invCategory,
    invSubcategory
  };
  
  const file = `backup_categories_${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  
  console.log('BACKUP_FILE=' + file);
  console.log('InvCategory=' + invCategory.length, 'InvSubcategory=' + invSubcategory.length);
  
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});

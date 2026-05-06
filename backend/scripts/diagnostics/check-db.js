const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({ log: ['error'] });

(async () => {
  try {
    // Check column nullability
    const cols = await p.$queryRawUnsafe(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'orders'
        AND column_name IN ('billingAddressId', 'shippingAddressId')
    `);
    console.log('Columns:', JSON.stringify(cols, null, 2));

    // Fix: make columns nullable
    await p.$executeRawUnsafe(`ALTER TABLE orders ALTER COLUMN "billingAddressId" DROP NOT NULL`);
    console.log('billingAddressId now nullable');
    await p.$executeRawUnsafe(`ALTER TABLE orders ALTER COLUMN "shippingAddressId" DROP NOT NULL`);
    console.log('shippingAddressId now nullable');

    // Test delete
    const addr = await p.address.findFirst({
      where: { id: '19ed653a-9478-43ca-afb2-45ea80bfa08f' },
    });
    if (addr) {
      await p.address.delete({ where: { id: addr.id } });
      console.log('DELETE SUCCESS');
    } else {
      console.log('Address already deleted');
    }

    await p.$disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  console.log('uuid-ossp extension enabled');
}

main().catch(console.error).finally(() => p.$disconnect());

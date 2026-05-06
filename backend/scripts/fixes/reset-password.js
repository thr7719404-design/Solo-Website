const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const email = 'admin@solo-ecommerce.com';
    const newPassword = 'AdminPassword123!';
    
    // Hash password with Argon2id (same as auth.service.ts)
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
    
    // Upsert - create if not exists, update if exists
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash: passwordHash },
      create: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: true,
      },
    });
    
    console.log('✅ Password set for:', user.email, '(Role:', user.role + ')');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

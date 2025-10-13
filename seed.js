const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding: tables + admin user…');

  // Tables (1..10)
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.table.upsert({
      where: { tableNumber: i },            // uses @unique tableNumber
      update: {},
      create: {
        tableNumber: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        status: 'AVAILABLE',
        qrCodeToken: `table-${i}-token-${Math.random().toString(36).slice(2, 15)}`,
      },
    });
    tables.push(table);
  }
  console.log(`✅ Tables ensured: ${tables.length}`);

  // Admin user (as STAFF by default)
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },  // must be @unique
    update: {},                                // nothing to change on re-run
    create: {
      name: 'Restaurant Admin',
      email: 'admin@restaurant.com',
      password: adminHash,                     // manual-login account
      // userType left to default(STAFF)
      isActive: true,
    },
  });
  console.log(`✅ Admin ensured: ${admin.email}`);

  console.log('🎉 Done. Login: admin@restaurant.com / admin123');
}

main().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

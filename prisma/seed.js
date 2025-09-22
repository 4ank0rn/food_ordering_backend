const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin1234';
  const hashed = await bcrypt.hash(password, 10);
  const ex = await prisma.user.findUnique({ where: { email } });
  if (!ex) {
    await prisma.user.create({
      data: { name: 'Admin', email, password: hashed },
    });
    console.log('Seeded admin', email, password);
  } else console.log('Admin exists');
}

main().finally(() => prisma.$disconnect());

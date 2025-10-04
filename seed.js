const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create tables
  console.log('Creating tables...');
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.table.upsert({
      where: { tableNumber: i },
      update: {},
      create: {
        tableNumber: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        status: 'AVAILABLE',
        qrCodeToken: `table-${i}-token-${Math.random().toString(36).slice(2, 15)}`,
      },
    });
    tables.push(table);
    console.log(`✅ Table ${i} created`);
  }

  // Create admin user
  console.log('\nCreating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      name: 'Restaurant Admin',
      email: 'admin@restaurant.com',
      password: hashedPassword,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create staff user
  console.log('\nCreating staff user...');
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@restaurant.com' },
    update: {},
    create: {
      name: 'Kitchen Staff',
      email: 'staff@restaurant.com',
      password: staffPassword,
    },
  });
  console.log('✅ Staff user created:', staff.email);

  // Create menu items
  console.log('\nCreating menu items...');
  const menuItems = [
    {
      name: 'Pad Thai',
      price: 12.99,
      description: 'Traditional Thai stir-fried noodles with shrimp or chicken',
      foodtype: 'NOODLE',
    },
    {
      name: 'Tom Yum Soup',
      price: 8.99,
      description: 'Spicy and sour Thai soup with mushrooms and herbs',
      foodtype: 'RICE',
    },
    {
      name: 'Green Curry',
      price: 14.99,
      description: 'Thai green curry with coconut milk and vegetables',
      foodtype: 'RICE',
    },
    {
      name: 'Som Tam',
      price: 7.99,
      description: 'Spicy green papaya salad',
      foodtype: 'NOODLE',
    },
    {
      name: 'Mango Sticky Rice',
      price: 6.99,
      description: 'Sweet coconut sticky rice with fresh mango',
      foodtype: 'DESSERT',
    },
    {
      name: 'Thai Iced Tea',
      price: 3.99,
      description: 'Traditional Thai iced tea with condensed milk',
      foodtype: 'DRINK',
    },
    {
      name: 'Massaman Curry',
      price: 15.99,
      description: 'Rich and mild Thai curry with potatoes and peanuts',
      foodtype: 'RICE',
    },
    {
      name: 'Thai Basil Stir Fry',
      price: 11.99,
      description: 'Spicy stir fry with Thai basil and choice of protein',
      foodtype: 'RICE',
    },
    {
      name: 'Coconut Soup',
      price: 9.99,
      description: 'Creamy coconut soup with galangal and lime leaves',
      foodtype: 'RICE',
    },
  ];

  for (const item of menuItems) {
    try {
      const menuItem = await prisma.menuItem.create({
        data: item,
      });
      console.log(`✅ Menu item "${item.name}" created`);
    } catch (error) {
      console.log(`⚠️  Menu item "${item.name}" might already exist`);
    }
  }

  // Create sample sessions
  console.log('\nCreating sample sessions...');
  const session1 = await prisma.session.create({
    data: {
      tableId: tables[0].id,
      metaJson: {
        deviceType: 'mobile',
        customerCount: 2,
      },
    },
  });
  console.log('✅ Sample session created for table 1');

  const session2 = await prisma.session.create({
    data: {
      tableId: tables[1].id,
      metaJson: {
        deviceType: 'tablet',
        customerCount: 4,
      },
    },
  });
  console.log('✅ Sample session created for table 2');

  // Create sample orders
  console.log('\nCreating sample orders...');
  const menu = await prisma.menuItem.findMany();

  const order1 = await prisma.order.create({
    data: {
      tableId: tables[0].id,
      sessionId: session1.id,
      status: 'PENDING',
      orderItems: {
        create: [
          {
            menuItemId: menu[0].id,
            quantity: 2,
            note: 'Extra spicy',
          },
          {
            menuItemId: menu[1].id,
            quantity: 1,
          },
        ],
      },
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });
  console.log('✅ Sample order 1 created');

  const order2 = await prisma.order.create({
    data: {
      tableId: tables[1].id,
      sessionId: session2.id,
      status: 'IN_PROGRESS',
      orderItems: {
        create: [
          {
            menuItemId: menu[2].id,
            quantity: 1,
          },
          {
            menuItemId: menu[4].id,
            quantity: 2,
          },
        ],
      },
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
    },
  });
  console.log('✅ Sample order 2 created');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`- Tables: ${tables.length}`);
  console.log(`- Menu Items: ${menuItems.length}`);
  console.log(`- Users: 2 (admin, staff)`);
  console.log(`- Sessions: 2`);
  console.log(`- Orders: 2`);
  console.log('\n🔑 Login Credentials:');
  console.log('Admin: admin@restaurant.com / admin123');
  console.log('Staff: staff@restaurant.com / staff123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

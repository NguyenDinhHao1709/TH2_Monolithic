const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Seed Roles
  const roles = [
    { roleid: 1, rolename: 'Admin' },
    { roleid: 2, rolename: 'normal' }
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { roleid: r.roleid },
      update: { rolename: r.rolename },
      create: r
    });
  }
  console.log('Seeded Roles: Admin, normal');

  // 2. Seed MemberShips
  const memberships = [
    { mid: 1, mname: 'Normal', score: 10 },
    { mid: 2, mname: 'Silver', score: 100 },
    { mid: 3, mname: 'Gold', score: 500 }
  ];

  for (const m of memberships) {
    await prisma.memberShip.upsert({
      where: { mid: m.mid },
      update: { mname: m.mname, score: m.score },
      create: m
    });
  }
  console.log('Seeded Memberships: Normal (score 10), Silver, Gold');

  // 3. Seed Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullname: 'System Administrator',
      password: hashedPassword,
      roleid: 1,
      mid: 3
    }
  });
  console.log(`Seeded Admin User: ${adminUser.username} (Password: admin123)`);

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

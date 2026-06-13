import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'jsonlileflo1@gmail.com';
  const password = 'Admin2026!';
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
    create: {
      email,
      password: hash,
      firstName: 'Jospin',
      lastName: 'Lilemo',
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`✅ Super admin: ${user.email} (role=${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

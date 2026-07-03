/**
 * Seed : compte livreur de test
 *   livreur@test.cd  /  Test1234!  → LIVREUR
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Test1234!', 10);

  const driver = await prisma.user.upsert({
    where:  { email: 'livreur@test.cd' },
    update: { password: hash, isActive: true, emailVerified: true },
    create: {
      id:            'test-driver-001',
      email:         'livreur@test.cd',
      firstName:     'Jean',
      lastName:      'Livreur',
      phone:         '+243810000099',
      password:      hash,
      role:          'LIVREUR',
      points:        0,
      isActive:      true,
      emailVerified: true,
    },
  });

  console.log('✅ Compte livreur créé :');
  console.log(`   Email    : ${driver.email}`);
  console.log(`   Mot de passe : Test1234!`);
  console.log(`   Nom      : ${driver.firstName} ${driver.lastName}`);
  console.log(`   Rôle     : ${driver.role}`);
  console.log(`   ID       : ${driver.id}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

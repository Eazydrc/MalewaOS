import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD = 'Test1234!';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { id: 'test-user-livraison-001' },
    update: { email: 'livraison@test.cd', password: hash, isActive: true, emailVerified: true },
    create: {
      id: 'test-user-livraison-001',
      email: 'livraison@test.cd',
      password: hash,
      firstName: 'Express',
      lastName: 'Kin',
      role: 'RESTAURANT',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✓ User: ${user.email}`);

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'test-resto-livraison-001' },
    update: { subscription: 'CROISSANCE', restaurantType: 'LIVRAISON', lat: -4.3276, lng: 15.3136 },
    create: {
      id:           'test-resto-livraison-001',
      ownerId:      user.id,
      name:         'Kin Express Livraison',
      description:  'Restaurant 100% livraison — pas de salle, pas de tables, uniquement des commandes livrées chez vous.',
      categories:   ['Fast-food', 'Grillades'],
      address:      'Avenue Kasa-Vubu, Kinshasa',
      city:         'Kinshasa',
      imageUrl:     'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
      images:       [],
      priceRange:   2,
      rating:       0,
      reviewCount:  0,
      isOpen:       true,
      isActive:     true,
      subscription: 'CROISSANCE',
      restaurantType: 'LIVRAISON',
      lat: -4.3276,
      lng: 15.3136,
      openingHours: {
        lun: { open: '10:00', close: '22:00', closed: false },
        mar: { open: '10:00', close: '22:00', closed: false },
        mer: { open: '10:00', close: '22:00', closed: false },
        jeu: { open: '10:00', close: '22:00', closed: false },
        ven: { open: '10:00', close: '23:00', closed: false },
        sam: { open: '10:00', close: '23:00', closed: false },
        dim: { open: '12:00', close: '21:00', closed: false },
      },
    },
  });
  console.log(`✓ Restaurant: ${restaurant.name} [${restaurant.restaurantType}]`);

  let menu = await prisma.menu.findFirst({ where: { restaurantId: restaurant.id, isActive: true } });
  if (!menu) {
    menu = await prisma.menu.create({ data: { restaurantId: restaurant.id, name: 'Menu principal' } });
  }
  await prisma.menuSection.deleteMany({ where: { menuId: menu.id } });

  const sections = [
    {
      title: 'Burgers & Sandwichs',
      items: [
        { name: 'Burger Express', description: 'Steak haché, cheddar, salade, sauce maison.', price: 600, isHot: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
        { name: 'Sandwich poulet', description: 'Poulet pané, crudités, mayonnaise.', price: 500, imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400' },
      ],
    },
    {
      title: 'Plats',
      items: [
        { name: 'Riz sauté au poulet', description: 'Riz sauté aux légumes et morceaux de poulet.', price: 700, isDailySpecial: true, imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400' },
        { name: 'Brochettes grillées', description: '5 brochettes de bœuf marinées, sauce piquante.', price: 650 },
      ],
    },
    {
      title: 'Boissons',
      items: [
        { name: 'Coca-Cola', description: '33cl bien frais.', price: 200 },
        { name: 'Jus naturel', description: 'Mangue ou ananas, 33cl.', price: 250 },
      ],
    },
  ];

  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    const section = await prisma.menuSection.create({
      data: { menuId: menu.id, title: sec.title, order: si },
    });
    for (let ii = 0; ii < sec.items.length; ii++) {
      const item = sec.items[ii] as any;
      await prisma.menuItem.create({
        data: {
          sectionId:      section.id,
          name:           item.name,
          description:    item.description,
          priceUsdCents:  item.price,
          imageUrl:       item.imageUrl ?? null,
          isHot:          item.isHot ?? false,
          isDailySpecial: item.isDailySpecial ?? false,
          isAvailable:    true,
          order:          ii,
        },
      });
    }
    console.log(`  ✓ Section "${sec.title}" — ${sec.items.length} plats`);
  }

  console.log('\n✅ Restaurant livraison créé !');
  console.log('  livraison@test.cd / Test1234! → CROISSANCE / LIVRAISON (http://localhost:4000/restaurant/test-resto-livraison-001)');
}

main().finally(() => prisma.$disconnect());

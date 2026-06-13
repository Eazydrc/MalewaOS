import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Upsert fake restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'fake-resto-test-001' },
    update: {},
    create: {
      id: 'fake-resto-test-001',
      ownerId: 'cmotm6adn0000twv3haplt083',
      name: 'Le Petit Congo',
      description: "Restaurant traditionnel avec les meilleures recettes de Kinshasa. Cuisine authentique, ambiance chaleureuse.",
      categories: ['Congolaise', 'Grillades', 'Street food'],
      phone: '+243 812 345 678',
      address: 'Avenue Kasa-Vubu 15, Lingwala',
      city: 'Kinshasa',
      imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      images: [],
      priceRange: 2,
      rating: 4.5,
      reviewCount: 127,
      isOpen: true,
      isActive: true,
      subscription: 'MAMAN',
      openingHours: {
        lun: { open: '08:00', close: '22:00', closed: false },
        mar: { open: '08:00', close: '22:00', closed: false },
        mer: { open: '08:00', close: '22:00', closed: false },
        jeu: { open: '08:00', close: '22:00', closed: false },
        ven: { open: '08:00', close: '23:00', closed: false },
        sam: { open: '10:00', close: '23:00', closed: false },
        dim: { open: '10:00', close: '21:00', closed: false },
      },
    },
  });
  console.log('Restaurant:', restaurant.name);

  // Upsert menu
  const menu = await prisma.menu.upsert({
    where: { id: 'fake-menu-001' },
    update: {},
    create: {
      id: 'fake-menu-001',
      restaurantId: restaurant.id,
      name: 'Menu principal',
      isActive: true,
    },
  });
  console.log('Menu:', menu.name);

  // Sections + items
  const sections = [
    {
      id: 'fake-sec-001',
      title: 'Entrees',
      order: 0,
      items: [
        { id: 'fake-item-001', name: 'Salade de papaye verte', description: 'Papaye verte rapee, carottes, tomates, citron vert', priceUsdCents: 250, promoPrice: null, imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', isHot: false, isLastUnits: false, order: 0 },
        { id: 'fake-item-002', name: 'Beignets de crevettes', description: 'Crevettes fraiches en beignet, sauce pimentee maison', priceUsdCents: 350, promoPrice: null, imageUrl: 'https://images.unsplash.com/photo-1626509653291-18d9a934b9db?w=400', isHot: true, isLastUnits: false, order: 1 },
        { id: 'fake-item-003', name: 'Soupe de poisson', description: 'Soupe traditionnelle au poisson fume et legumes', priceUsdCents: 300, promoPrice: 250, imageUrl: null, isHot: false, isLastUnits: true, order: 2 },
      ],
    },
    {
      id: 'fake-sec-002',
      title: 'Plats principaux',
      order: 1,
      items: [
        { id: 'fake-item-004', name: 'Poulet moambe', description: 'Poulet mijote dans la sauce moambe traditionnelle, servi avec du riz blanc', priceUsdCents: 800, promoPrice: null, imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c1?w=400', isHot: true, isLastUnits: false, order: 0 },
        { id: 'fake-item-005', name: 'Poisson braise + Fufu', description: 'Tilapia braise au feu de bois, servi avec fufu de manioc et legumes sautes', priceUsdCents: 950, promoPrice: 800, imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400', isHot: true, isLastUnits: false, order: 1 },
        { id: 'fake-item-006', name: 'Saka-saka au porc', description: "Feuilles de manioc pilees avec du porc, huile de palme et crevettes fumees", priceUsdCents: 750, promoPrice: null, imageUrl: null, isHot: false, isLastUnits: false, order: 2 },
        { id: 'fake-item-007', name: 'Grillades mixtes', description: 'Assortiment de viandes grillees (boeuf, poulet, chevre) avec plantain frit', priceUsdCents: 1200, promoPrice: null, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', isHot: false, isLastUnits: true, order: 3 },
        { id: 'fake-item-008', name: 'Riz congolais au poulet', description: 'Riz cuit avec poulet fermier, tomates et epices locales', priceUsdCents: 650, promoPrice: null, imageUrl: null, isHot: false, isLastUnits: false, order: 4, isAvailable: false },
      ],
    },
    {
      id: 'fake-sec-003',
      title: 'Boissons',
      order: 2,
      items: [
        { id: 'fake-item-009', name: 'Eau minerale Mayombe', description: 'Bouteille 50cl', priceUsdCents: 50, promoPrice: null, imageUrl: null, isHot: false, isLastUnits: false, order: 0 },
        { id: 'fake-item-010', name: 'Jus de bissap', description: 'Jus hibiscus frais, legerement sucre', priceUsdCents: 150, promoPrice: null, imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400', isHot: false, isLastUnits: false, order: 1 },
        { id: 'fake-item-011', name: 'Primus 65cl', description: 'Biere congolaise Primus bien fraiche', priceUsdCents: 200, promoPrice: null, imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', isHot: true, isLastUnits: false, order: 2 },
        { id: 'fake-item-012', name: 'Coca-Cola 33cl', description: '', priceUsdCents: 150, promoPrice: null, imageUrl: null, isHot: false, isLastUnits: false, order: 3 },
      ],
    },
  ];

  for (const sec of sections) {
    await prisma.menuSection.upsert({
      where: { id: sec.id },
      update: {},
      create: { id: sec.id, menuId: menu.id, title: sec.title, order: sec.order },
    });
    for (const item of sec.items) {
      await prisma.menuItem.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          sectionId: sec.id,
          name: item.name,
          description: item.description || undefined,
          priceUsdCents: item.priceUsdCents,
          promoPrice: item.promoPrice ?? undefined,
          imageUrl: item.imageUrl ?? undefined,
          isAvailable: (item as any).isAvailable ?? true,
          isHot: item.isHot,
          isLastUnits: item.isLastUnits,
          order: item.order,
        },
      });
    }
    console.log('Section cree:', sec.title, '—', sec.items.length, 'items');
  }

  console.log('\nFake restaurant pret! Test sur: http://localhost:4000/r/fake-resto-test-001');
}

main().catch(console.error).finally(() => prisma.$disconnect());

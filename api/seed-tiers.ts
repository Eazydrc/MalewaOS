/**
 * Seed : 4 comptes restaurateurs de test — un par tier
 *
 * Comptes créés :
 *   maman@test.cd        / Test1234!  → MAMAN        (3$/mois)
 *   essentiel@test.cd    / Test1234!  → ESSENTIEL    (10$/mois)
 *   croissance@test.cd   / Test1234!  → CROISSANCE   (25$/mois)
 *   domination@test.cd   / Test1234!  → DOMINATION   (45$/mois)
 *
 * + 1 compte client de test avec des réservations sur chacun des 4 restaurants :
 *   client@test.cd       / Test1234!  → CLIENT
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD = 'Test1234!';

// ─── Données par tier ─────────────────────────────────────────────────────────

const TIERS = [
  {
    email: 'maman@test.cd',
    firstName: 'Mama', lastName: 'Kimia',
    userId: 'test-user-maman-001',
    restaurantId: 'test-resto-maman-001',
    subscription: 'MAMAN' as const,
    name: 'Chez Mama Kimia',
    description: 'La cuisine de maman — plats traditionnels congolais préparés avec amour.',
    categories: ['Congolaise', 'Africaine'],
    address: 'Avenue Victoire 42, Kintambo',
    city: 'Kinshasa',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    priceRange: 1,
  },
  {
    email: 'essentiel@test.cd',
    firstName: 'Patrick', lastName: 'Mbeki',
    userId: 'test-user-essentiel-001',
    restaurantId: 'test-resto-essentiel-001',
    subscription: 'ESSENTIEL' as const,
    name: 'Le Bistro Moderne',
    description: 'Cuisine africaine revisitée avec une touche internationale. Cadre moderne et accueillant.',
    categories: ['Africaine', 'Internationale'],
    address: 'Boulevard du 30 Juin 118, Gombe',
    city: 'Kinshasa',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    priceRange: 2,
  },
  {
    email: 'croissance@test.cd',
    firstName: 'Sandra', lastName: 'Lufungula',
    userId: 'test-user-croissance-001',
    restaurantId: 'test-resto-croissance-001',
    subscription: 'CROISSANCE' as const,
    name: 'Pizza & Grill Kinshasa',
    description: 'Pizzas artisanales, grillades fraîches et plats à emporter. Livraison disponible !',
    categories: ['Pizza', 'Grillades', 'Fast-food'],
    address: 'Avenue Colonel Mondjiba 7, Ngaliema',
    city: 'Kinshasa',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    priceRange: 2,
  },
  {
    email: 'domination@test.cd',
    firstName: 'Élysée', lastName: 'Mwamba',
    userId: 'test-user-domination-001',
    restaurantId: 'test-resto-domination-001',
    subscription: 'DOMINATION' as const,
    name: 'Le Grand Fleuve',
    description: 'Restaurant gastronomique au bord du fleuve Congo. Fine cuisine, cave à vins, service VIP.',
    categories: ['Internationale', 'Fruits de mer', 'Grillades'],
    address: 'Corniche du Fleuve, Gombe',
    city: 'Kinshasa',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    priceRange: 3,
  },
] as const;

// ─── Menu items par tier ──────────────────────────────────────────────────────

type SubscriptionTier = 'MAMAN' | 'ESSENTIEL' | 'CROISSANCE' | 'DOMINATION';

const MENUS: Record<SubscriptionTier, { sectionTitle: string; items: { name: string; description: string; price: number; promoPrice?: number; isHot?: boolean; isLastUnits?: boolean; imageUrl?: string }[] }[]> = {
  MAMAN: [
    {
      sectionTitle: 'Plats du jour',
      items: [
        { name: 'Poulet moambé',       description: 'Poulet mijoté dans la sauce moambé, servi avec du riz blanc.',          price: 500, imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400' },
        { name: 'Saka-saka',           description: 'Feuilles de manioc pilées avec poisson fumé et huile de palme.',          price: 300 },
        { name: 'Liboke de poisson',   description: 'Poisson frais mariné et cuit en papillote avec épices locales.',          price: 700 },
      ],
    },
    {
      sectionTitle: 'Boissons',
      items: [
        { name: 'Eau fraîche',  description: '50cl', price: 100 },
        { name: 'Jus de tamarin', description: 'Fait maison', price: 200 },
      ],
    },
  ],

  ESSENTIEL: [
    {
      sectionTitle: 'Entrées',
      items: [
        { name: 'Salade Gombe',       description: 'Salade fraîche avec avocat, tomates et vinaigrette maison.',  price: 350,  isHot: true,  imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
        { name: 'Brochettes de bœuf', description: '4 brochettes marinées aux herbes, sauce piquante.',            price: 500,  isLastUnits: true },
      ],
    },
    {
      sectionTitle: 'Plats principaux',
      items: [
        { name: 'Poulet rôti',      description: 'Demi-poulet rôti avec frites maison et salade.',               price: 800,  promoPrice: 650, isHot: true,  imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=400' },
        { name: 'Thiébou yapp',     description: 'Riz au mouton à la sénégalaise avec légumes de saison.',       price: 700,  imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400' },
        { name: 'Steak grillé',     description: '200g de steak de bœuf avec légumes grillés et sauce béarnaise.', price: 1200, promoPrice: 950, isLastUnits: true },
      ],
    },
    {
      sectionTitle: 'Desserts',
      items: [
        { name: 'Gâteau manioc',  description: 'Gâteau traditionnel au manioc sucré et lait de coco.',  price: 250 },
        { name: 'Fruits frais',   description: 'Assortiment de fruits tropicaux de saison.',             price: 300 },
      ],
    },
    {
      sectionTitle: 'Boissons',
      items: [
        { name: 'Jus d\'ananas',  description: 'Frais pressé, 33cl.',   price: 250 },
        { name: 'Eau minérale',   description: '50cl.',                  price: 100 },
        { name: 'Bière Primus',   description: '65cl, bien fraîche.',    price: 350 },
      ],
    },
  ],

  CROISSANCE: [
    {
      sectionTitle: 'Pizzas',
      items: [
        { name: 'Margherita',       description: 'Sauce tomate, mozzarella, basilic frais.',             price: 600, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
        { name: 'Pizza Kinshasa',   description: 'Viande de bœuf, poivrons, oignons, sauce piquante.', price: 750, isHot: true, promoPrice: 600 },
        { name: 'Végétarienne',     description: 'Légumes grillés, mozzarella, olives, pesto.',         price: 650 },
        { name: 'Quatre saisons',   description: 'Jambon, champignons, artichauts, olives.',            price: 800, isLastUnits: true },
      ],
    },
    {
      sectionTitle: 'Grillades',
      items: [
        { name: 'Côtes de bœuf',    description: '300g de côtes grillées, sauce barbecue maison, frites.', price: 1500, isHot: true, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' },
        { name: 'Poulet grillé',    description: 'Demi-poulet mariné aux herbes, servi avec salade.',      price: 900, promoPrice: 750 },
        { name: 'Brochettes mixtes', description: 'Bœuf, poulet, légumes. Sauce au choix.',               price: 700 },
      ],
    },
    {
      sectionTitle: 'Formules',
      items: [
        { name: 'Menu Business',  description: 'Entrée + plat + dessert + boisson. Valable midi semaine.', price: 1000, isHot: true },
      ],
    },
    {
      sectionTitle: 'Boissons & Desserts',
      items: [
        { name: 'Coca-Cola',       description: '33cl bien frais.',                       price: 200 },
        { name: 'Jus tropical',    description: 'Mangue, ananas, maracuja. 33cl.',        price: 300 },
        { name: 'Tiramisu',        description: 'Recette italienne traditionnelle.',       price: 350 },
        { name: 'Fondant chocolat', description: 'Chaud avec boule de glace vanille.',   price: 400, isLastUnits: true },
      ],
    },
  ],

  DOMINATION: [
    {
      sectionTitle: 'Amuse-bouches',
      items: [
        { name: 'Huîtres fraîches',    description: '6 huîtres de l\'Atlantique, mignonette et citron.',  price: 1200, isLastUnits: true, imageUrl: 'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=400' },
        { name: 'Foie gras maison',    description: 'Foie gras de canard, brioche toastée, chutney de mangue.', price: 1500, isHot: true },
        { name: 'Carpaccio de thon',   description: 'Thon rouge, huile citronnée, câpres, roquette.', price: 900 },
      ],
    },
    {
      sectionTitle: 'Poissons & Fruits de mer',
      items: [
        { name: 'Homard grillé',      description: 'Demi-homard breton grillé au beurre persillé, pommes vapeur.', price: 4500, isHot: true, imageUrl: 'https://images.unsplash.com/photo-1559208645-5d8b5bf4e3b9?w=400' },
        { name: 'Tilapia du Congo',   description: 'Filet de tilapia en croûte d\'herbes, légumes du marché.',       price: 1800, promoPrice: 1500 },
        { name: 'Crevettes sautées',  description: 'Gambas sautées à l\'ail et au piment, riz pilaf.',              price: 2200, isLastUnits: true },
      ],
    },
    {
      sectionTitle: 'Viandes',
      items: [
        { name: 'Filet de bœuf Wagyu', description: '200g de Wagyu A5 japonais, sauce truffe, pommes Dauphine.',   price: 8000, isHot: true, imageUrl: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=400' },
        { name: 'Agneau de lait',      description: 'Carré d\'agneau rôti, jus de romarin, gratin dauphinois.',     price: 3500 },
        { name: 'Canard à l\'orange',  description: 'Magret de canard, sauce bigarade, purée de céleri.',           price: 2800, promoPrice: 2400 },
      ],
    },
    {
      sectionTitle: 'Desserts de chef',
      items: [
        { name: 'Soufflé au chocolat', description: 'Soufflé chaud au chocolat 70%, glace vanille bourbon.',     price: 900, isLastUnits: true },
        { name: 'Tarte tatin',          description: 'Tatin de mangue caramélisée, crème fraîche épaisse.',      price: 750 },
        { name: 'Cheese cake exotique', description: 'Cheese cake passion-coco avec coulis de fruits rouges.', price: 700 },
      ],
    },
    {
      sectionTitle: 'Cave & Boissons',
      items: [
        { name: 'Champagne Moët',   description: 'Brut Impérial 75cl.',         price: 15000, isHot: true },
        { name: 'Vin rouge Margaux', description: 'Bordeaux 2018, 75cl.',        price: 8000 },
        { name: 'Eau Evian',        description: 'Bouteille 75cl.',              price: 300 },
        { name: 'Cocktail signature', description: 'Création du barman, à base de whisky et fruits tropicaux.', price: 1200 },
      ],
    },
  ],
};

// ─── Script principal ─────────────────────────────────────────────────────────

// ─── Réservations d'exemple par tier ──────────────────────────────────────────

const RESERVATIONS: Record<SubscriptionTier, { daysOffset: number; hour: number; partySize: number; status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'; notes?: string }[]> = {
  MAMAN: [
    { daysOffset: 2,  hour: 13, partySize: 2, status: 'CONFIRMED' },
    { daysOffset: -5, hour: 12, partySize: 4, status: 'COMPLETED' },
  ],
  ESSENTIEL: [
    { daysOffset: 1,  hour: 19, partySize: 3, status: 'PENDING', notes: 'Table près de la fenêtre si possible' },
    { daysOffset: 4,  hour: 20, partySize: 2, status: 'CONFIRMED' },
    { daysOffset: -3, hour: 13, partySize: 5, status: 'COMPLETED' },
  ],
  CROISSANCE: [
    { daysOffset: 0,  hour: 20, partySize: 6, status: 'CONFIRMED', notes: 'Anniversaire — gâteau apporté' },
    { daysOffset: -1, hour: 19, partySize: 2, status: 'NO_SHOW' },
    { daysOffset: -7, hour: 12, partySize: 4, status: 'COMPLETED' },
  ],
  DOMINATION: [
    { daysOffset: 3,  hour: 20, partySize: 2, status: 'CONFIRMED', notes: 'Dîner VIP — vue fleuve demandée' },
    { daysOffset: 6,  hour: 21, partySize: 8, status: 'PENDING', notes: 'Groupe entreprise' },
    { daysOffset: -2, hour: 20, partySize: 2, status: 'CANCELLED' },
    { daysOffset: -10, hour: 19, partySize: 4, status: 'COMPLETED' },
  ],
};

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  // Compte client de test, utilisé pour les réservations d'exemple
  const clientUser = await prisma.user.upsert({
    where: { id: 'test-user-client-001' },
    update: { email: 'client@test.cd', password: hash, isActive: true, emailVerified: true },
    create: {
      id:        'test-user-client-001',
      email:     'client@test.cd',
      password:  hash,
      firstName: 'Christelle',
      lastName:  'Nzuzi',
      role:      'CLIENT',
      isActive:  true,
      emailVerified: true,
    },
  });
  console.log(`▶ Compte client de test : ${clientUser.email}`);

  for (const tier of TIERS) {
    console.log(`\n▶ Création compte ${tier.subscription} — ${tier.email}`);

    // 1. Utilisateur
    const user = await prisma.user.upsert({
      where: { id: tier.userId },
      update: { email: tier.email, password: hash, isActive: true, emailVerified: true },
      create: {
        id:        tier.userId,
        email:     tier.email,
        password:  hash,
        firstName: tier.firstName,
        lastName:  tier.lastName,
        role:      'RESTAURANT',
        isActive:  true,
        emailVerified: true,
      },
    });
    console.log(`  ✓ User: ${user.email}`);

    // 2. Restaurant
    const restaurant = await prisma.restaurant.upsert({
      where: { id: tier.restaurantId },
      update: { subscription: tier.subscription },
      create: {
        id:           tier.restaurantId,
        ownerId:      tier.userId,
        name:         tier.name,
        description:  tier.description,
        categories:   [...tier.categories],
        address:      tier.address,
        city:         tier.city,
        imageUrl:     tier.imageUrl,
        images:       [],
        priceRange:   tier.priceRange,
        rating:       0,
        reviewCount:  0,
        isOpen:       true,
        isActive:     true,
        subscription: tier.subscription,
        openingHours: {
          lun: { open: '08:00', close: '23:00', closed: false },
          mar: { open: '08:00', close: '23:00', closed: false },
          mer: { open: '08:00', close: '23:00', closed: false },
          jeu: { open: '08:00', close: '23:00', closed: false },
          ven: { open: '08:00', close: '00:00', closed: false },
          sam: { open: '10:00', close: '00:00', closed: false },
          dim: { open: '11:00', close: '21:00', closed: false },
        },
      },
    });
    console.log(`  ✓ Restaurant: ${restaurant.name} [${restaurant.subscription}]`);

    // 3. Menu
    const menuData = MENUS[tier.subscription];

    let menu = await prisma.menu.findFirst({
      where: { restaurantId: restaurant.id, isActive: true },
    });
    if (!menu) {
      menu = await prisma.menu.create({
        data: { restaurantId: restaurant.id, name: 'Menu principal' },
      });
    }

    // Supprimer sections existantes pour repartir propre
    await prisma.menuSection.deleteMany({ where: { menuId: menu.id } });

    for (let si = 0; si < menuData.length; si++) {
      const sec = menuData[si];
      const section = await prisma.menuSection.create({
        data: { menuId: menu.id, title: sec.sectionTitle, order: si },
      });

      for (let ii = 0; ii < sec.items.length; ii++) {
        const item = sec.items[ii];
        await prisma.menuItem.create({
          data: {
            sectionId:     section.id,
            name:          item.name,
            description:   item.description,
            priceUsdCents: item.price,
            promoPrice:    item.promoPrice ?? null,
            imageUrl:      item.imageUrl   ?? null,
            isHot:         item.isHot      ?? false,
            isLastUnits:   item.isLastUnits ?? false,
            isAvailable:   true,
            order:         ii,
          },
        });
      }
      console.log(`    ✓ Section "${sec.sectionTitle}" — ${sec.items.length} plats`);
    }

    // 4. Offres pour ESSENTIEL+
    const hasOffers = ['ESSENTIEL', 'CROISSANCE', 'DOMINATION'].includes(tier.subscription);
    if (hasOffers) {
      await prisma.offer.deleteMany({ where: { restaurantId: restaurant.id } });

      const offers = [
        {
          title: 'Happy Hour',
          description: '-20% sur toutes les boissons entre 17h et 19h, du lundi au vendredi.',
          type: 'PROMO' as const,
          discountPct: 20,
          expiresAt: new Date('2026-12-31'),
          isActive: true,
        },
        ...(tier.subscription === 'CROISSANCE' || tier.subscription === 'DOMINATION' ? [
          {
            title: 'Offre fidélité',
            description: 'Utilisez 50 points pour obtenir un dessert offert.',
            type: 'POINTS' as const,
            pointsCost: 50,
            expiresAt: new Date('2026-12-31'),
            isActive: true,
          },
        ] : []),
        ...(tier.subscription === 'DOMINATION' ? [
          {
            title: '⚡ Flash du soir',
            description: 'Ce soir seulement : entrée + plat à prix exceptionnel. 10 couverts disponibles.',
            type: 'FLASH' as const,
            discountPct: 30,
            maxUses: 10,
            expiresAt: new Date('2026-12-31'),
            isActive: true,
          },
        ] : []),
      ];

      for (const offer of offers) {
        await prisma.offer.create({
          data: { restaurantId: restaurant.id, ...offer, usedCount: 0 },
        });
      }
      console.log(`    ✓ ${offers.length} offre(s) créée(s)`);
    }

    // 5. Réservations d'exemple pour le compte client de test
    await prisma.reservation.deleteMany({ where: { userId: clientUser.id, restaurantId: restaurant.id } });

    const reservations = RESERVATIONS[tier.subscription];
    for (const r of reservations) {
      const date = new Date();
      date.setDate(date.getDate() + r.daysOffset);
      date.setHours(r.hour, 0, 0, 0);

      await prisma.reservation.create({
        data: {
          userId:       clientUser.id,
          restaurantId: restaurant.id,
          date,
          partySize:    r.partySize,
          notes:        r.notes ?? null,
          status:       r.status,
        },
      });
    }
    console.log(`    ✓ ${reservations.length} réservation(s) créée(s) pour ${clientUser.email}`);
  }

  console.log('\n✅ Seed terminé !\n');
  console.log('Comptes de test :');
  console.log('  maman@test.cd        / Test1234!  → MAMAN        (http://localhost:4000/r/test-resto-maman-001)');
  console.log('  essentiel@test.cd    / Test1234!  → ESSENTIEL    (http://localhost:4000/r/test-resto-essentiel-001)');
  console.log('  croissance@test.cd   / Test1234!  → CROISSANCE   (http://localhost:4000/r/test-resto-croissance-001)');
  console.log('  domination@test.cd   / Test1234!  → DOMINATION   (http://localhost:4000/r/test-resto-domination-001)');
  console.log('  client@test.cd       / Test1234!  → CLIENT       (réservations sur les 4 restaurants ci-dessus)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

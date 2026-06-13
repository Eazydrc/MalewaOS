import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Ordre de priorité affichage pour algo mixte
const TIER_RANK: Record<string, number> = {
  DOMINATION: 1, CROISSANCE: 2, ESSENTIEL: 3, MAMAN: 4, DECOUVERTE: 5,
};

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  async getFeed() {
    const now = new Date();

    const [dailySpecialsRaw, promoOffersRaw, popularRestaurants] = await Promise.all([
      // Plats du jour actifs
      this.prisma.menuItem.findMany({
        where: {
          isDailySpecial: true,
          isAvailable: true,
          OR: [
            { dailySpecialEndsAt: null },
            { dailySpecialEndsAt: { gt: now } },
          ],
          section: {
            menu: {
              isActive: true,
              restaurant: { isActive: true },
            },
          },
        },
        include: {
          section: {
            include: {
              menu: {
                include: {
                  restaurant: {
                    select: {
                      id: true, name: true, imageUrl: true,
                      subscription: true, cuisine: true, restaurantType: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 40, // fetch large, on trie en mémoire
      }),

      // Offres promo actives
      this.prisma.offer.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: now },
          type: { in: ['PROMO', 'FLASH'] },
          restaurant: { isActive: true },
        },
        include: {
          restaurant: {
            select: {
              id: true, name: true, imageUrl: true,
              subscription: true, cuisine: true,
            },
          },
        },
        take: 30,
      }),

      // Restaurants populaires
      this.prisma.restaurant.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, description: true, imageUrl: true,
          cuisine: true, restaurantType: true, subscription: true,
          rating: true, reviewCount: true, isOpen: true,
          address: true, city: true, priceRange: true,
        },
        orderBy: { rating: 'desc' },
        take: 12,
      }),
    ]);

    // Trier plats du jour par tier (DOMINATION > CROISSANCE > ...)
    const dailySpecials = dailySpecialsRaw
      .sort((a, b) => {
        const subA = (a.section.menu.restaurant as any).subscription;
        const subB = (b.section.menu.restaurant as any).subscription;
        return (TIER_RANK[subA] ?? 99) - (TIER_RANK[subB] ?? 99);
      })
      .slice(0, 20)
      .map(item => ({
        id:                item.id,
        name:              item.name,
        description:       item.description,
        priceUsdCents:     item.priceUsdCents,
        promoPrice:        item.promoPrice,
        imageUrl:          item.imageUrl,
        isDailySpecial:    item.isDailySpecial,
        dailySpecialEndsAt: item.dailySpecialEndsAt,
        isHot:             item.isHot,
        restaurant:        item.section.menu.restaurant,
      }));

    // Trier offres par tier
    const promoOffers = promoOffersRaw
      .sort((a, b) => {
        const subA = (a.restaurant as any).subscription;
        const subB = (b.restaurant as any).subscription;
        return (TIER_RANK[subA] ?? 99) - (TIER_RANK[subB] ?? 99);
      })
      .slice(0, 10);

    return { dailySpecials, promoOffers, popularRestaurants };
  }
}

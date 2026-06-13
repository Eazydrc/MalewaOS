import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ESSENTIEL_TIERS, DAILY_SPECIAL_QUOTA } from '../common/tiers.constants';
import { CreateSectionDto, UpdateSectionDto, CreateItemDto, UpdateItemDto } from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ── Résoudre le restaurant depuis l'owner ─────────────────────────────────

  private async getOwnedRestaurant(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Aucun restaurant trouvé pour ce compte');
    return restaurant;
  }

  private assertNotDecouverte(restaurant: { subscription: string }) {
    if (restaurant.subscription === 'DECOUVERTE') {
      throw new ForbiddenException(
        'Le pack DÉCOUVERTE ne permet pas de modifier le menu. Passez au pack MAMAN pour activer cette fonctionnalité.',
      );
    }
  }

  // ── Créer ou récupérer le menu principal ─────────────────────────────────

  async ensureMenu(ownerId: string) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    let menu = await this.prisma.menu.findFirst({
      where: { restaurantId: restaurant.id, isActive: true },
      include: {
        sections: {
          include: { items: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!menu) {
      menu = await this.prisma.menu.create({
        data: { restaurantId: restaurant.id, name: 'Menu principal' },
        include: {
          sections: {
            include: { items: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
      });
    }
    return menu;
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  async createSection(ownerId: string, dto: CreateSectionDto) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    this.assertNotDecouverte(restaurant);
    const menu = await this.ensureMenu(ownerId);
    return this.prisma.menuSection.create({
      data: {
        menuId: menu.id,
        title: dto.title,
        order: dto.order ?? (menu.sections?.length ?? 0),
      },
      include: { items: true },
    });
  }

  async updateSection(sectionId: string, ownerId: string, dto: UpdateSectionDto) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    this.assertNotDecouverte(restaurant);
    await this.assertSectionOwner(sectionId, ownerId);
    return this.prisma.menuSection.update({
      where: { id: sectionId },
      data: dto,
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteSection(sectionId: string, ownerId: string) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    this.assertNotDecouverte(restaurant);
    await this.assertSectionOwner(sectionId, ownerId);
    await this.prisma.menuSection.delete({ where: { id: sectionId } });
    return { message: 'Section supprimée' };
  }

  // ── Items ─────────────────────────────────────────────────────────────────

  async createItem(sectionId: string, ownerId: string, dto: CreateItemDto) {
    const ownedRestaurant = await this.getOwnedRestaurant(ownerId);
    this.assertNotDecouverte(ownedRestaurant);
    const section = await this.assertSectionOwner(sectionId, ownerId);
    const restaurant = section.menu.restaurant;

    // Badges + promoPrice = ESSENTIEL+
    const hasEssentiel = (ESSENTIEL_TIERS as readonly string[]).includes(restaurant.subscription);
    if (!hasEssentiel && (dto.isHot || dto.isLastUnits || dto.promoPrice != null))
      throw new BadRequestException('Badges et promotions disponibles a partir du pack Essentiel');

    const count = await this.prisma.menuItem.count({ where: { sectionId } });
    return this.prisma.menuItem.create({
      data: {
        sectionId,
        name:          dto.name,
        description:   dto.description,
        priceUsdCents: dto.priceUsdCents,
        promoPrice:    hasEssentiel ? dto.promoPrice        : undefined,
        imageUrl:      dto.imageUrl,
        isHot:         hasEssentiel ? (dto.isHot ?? false)  : false,
        isLastUnits:   hasEssentiel ? (dto.isLastUnits ?? false) : false,
        order:         dto.order    ?? count,
        isAvailable:   true,
      },
    });
  }

  // ── Menu public (sans auth) ───────────────────────────────────────────────

  async getPublicMenu(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId, isActive: true },
      select: {
        id: true, name: true, description: true, imageUrl: true,
        address: true, city: true, isOpen: true, openingHours: true,
        categories: true, priceRange: true, rating: true, reviewCount: true,
        subscription: true,
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    const menu = await this.prisma.menu.findFirst({
      where: { restaurantId, isActive: true },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    return { restaurant, menu };
  }

  async updateItem(itemId: string, ownerId: string, dto: UpdateItemDto) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    this.assertNotDecouverte(restaurant);
    await this.assertItemOwner(itemId, ownerId);
    return this.prisma.menuItem.update({ where: { id: itemId }, data: dto });
  }

  async toggleItem(itemId: string, ownerId: string) {
    await this.assertItemOwner(itemId, ownerId);
    const item = await this.prisma.menuItem.findUnique({ where: { id: itemId } });
    return this.prisma.menuItem.update({
      where: { id: itemId },
      data:  { isAvailable: !item!.isAvailable },
    });
  }

  async deleteItem(itemId: string, ownerId: string) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    this.assertNotDecouverte(restaurant);
    await this.assertItemOwner(itemId, ownerId);
    await this.prisma.menuItem.delete({ where: { id: itemId } });
    return { message: 'Plat supprimé' };
  }

  // ── Ownership guards ──────────────────────────────────────────────────────

  private async assertSectionOwner(sectionId: string, ownerId: string) {
    const section = await this.prisma.menuSection.findUnique({
      where: { id: sectionId },
      include: { menu: { include: { restaurant: true } } },
    });
    if (!section) throw new NotFoundException('Section introuvable');
    if (section.menu.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    return section;
  }

  private async assertItemOwner(itemId: string, ownerId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { section: { include: { menu: { include: { restaurant: true } } } } },
    });
    if (!item) throw new NotFoundException('Plat introuvable');
    if (item.section.menu.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    return item;
  }

  // ── Plat du jour ──────────────────────────────────────────────────────────

  async toggleDailySpecial(itemId: string, ownerId: string, isDailySpecial: boolean, endsAt?: string) {
    const item = await this.assertItemOwner(itemId, ownerId);
    const restaurant = item.section.menu.restaurant;

    if (isDailySpecial) {
      const quota = DAILY_SPECIAL_QUOTA[restaurant.subscription];

      // Tier DECOUVERTE → jamais
      if (quota === 0) {
        throw new ForbiddenException('Le plat du jour est disponible à partir du pack MAMAN');
      }

      if (quota !== null) {
        // Reset mensuel si nécessaire
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const needsReset = !restaurant.dailySpecialResetAt || restaurant.dailySpecialResetAt < startOfMonth;

        if (needsReset) {
          await this.prisma.restaurant.update({
            where: { id: restaurant.id },
            data:  { dailySpecialDaysUsed: 0, dailySpecialResetAt: now },
          });
          restaurant.dailySpecialDaysUsed = 0;
        }

        if (restaurant.dailySpecialDaysUsed >= quota) {
          throw new ForbiddenException(
            `Quota mensuel atteint (${quota} jours). Passez au pack supérieur ou activez l'add-on.`,
          );
        }

        // Incrémenter compteur
        await this.prisma.restaurant.update({
          where: { id: restaurant.id },
          data:  { dailySpecialDaysUsed: { increment: 1 } },
        });
      }
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data:  {
        isDailySpecial,
        dailySpecialEndsAt: isDailySpecial && endsAt ? new Date(endsAt) : null,
      },
    });
  }

  async getDailySpecialStatus(ownerId: string) {
    const restaurant = await this.getOwnedRestaurant(ownerId);

    // Reset mensuel si nécessaire
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const needsReset = !restaurant.dailySpecialResetAt || restaurant.dailySpecialResetAt < startOfMonth;

    const used   = needsReset ? 0 : restaurant.dailySpecialDaysUsed;
    const quota  = DAILY_SPECIAL_QUOTA[restaurant.subscription];
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      used,
      quota,
      remaining:   quota === null ? null : Math.max(0, quota - used),
      isUnlimited: quota === null,
      resetsAt:    nextMonth.toISOString(),
      tier:        restaurant.subscription,
    };
  }
}

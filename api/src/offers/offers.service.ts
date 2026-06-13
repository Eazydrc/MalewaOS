import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';

const ESSENTIEL_TIERS = ['ESSENTIEL', 'CROISSANCE', 'DOMINATION'];

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedRestaurant(ownerId: string) {
    const r = await this.prisma.restaurant.findFirst({ where: { ownerId, isActive: true } });
    if (!r) throw new NotFoundException('Restaurant introuvable');
    if (!ESSENTIEL_TIERS.includes(r.subscription))
      throw new ForbiddenException('Offres disponibles a partir du pack Essentiel');
    return r;
  }

  // ── CRUD owner ────────────────────────────────────────────────────────────

  async findMine(ownerId: string) {
    const r = await this.getOwnedRestaurant(ownerId);
    return this.prisma.offer.findMany({
      where: { restaurantId: r.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerId: string, dto: CreateOfferDto) {
    const r = await this.getOwnedRestaurant(ownerId);
    return this.prisma.offer.create({
      data: {
        restaurantId: r.id,
        title:       dto.title,
        description: dto.description,
        type:        dto.type,
        discountPct: dto.discountPct,
        pointsCost:  dto.pointsCost,
        expiresAt:   new Date(dto.expiresAt),
        maxUses:     dto.maxUses,
      },
    });
  }

  async update(id: string, ownerId: string, dto: UpdateOfferDto) {
    await this.assertOwner(id, ownerId);
    return this.prisma.offer.update({
      where: { id },
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwner(id, ownerId);
    await this.prisma.offer.delete({ where: { id } });
    return { message: 'Offre supprimee' };
  }

  // ── Public ────────────────────────────────────────────────────────────────

  async findPublic(restaurantId: string) {
    return this.prisma.offer.findMany({
      where: {
        restaurantId,
        isActive: true,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Guard ─────────────────────────────────────────────────────────────────

  private async assertOwner(offerId: string, ownerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { restaurant: true },
    });
    if (!offer) throw new NotFoundException('Offre introuvable');
    if (offer.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    return offer;
  }
}

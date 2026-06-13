import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, ReplyReviewDto } from './dto/review.dto';

const ESSENTIEL_TIERS = ['ESSENTIEL', 'CROISSANCE', 'DOMINATION'];

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  // ── Client ────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { userId_restaurantId: { userId, restaurantId: dto.restaurantId } },
    });
    if (existing) throw new ConflictException('Vous avez deja laisse un avis pour ce restaurant');

    // Créer l'avis et recalculer la note dans la même transaction logique
    const review = await this.prisma.review.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
        rating:  dto.rating,
        comment: dto.comment,
      },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });

    // Recalcule la note moyenne (best-effort — non critique si échoue)
    await this.recalcRating(dto.restaurantId).catch((err) =>
      this.logger.warn(`Recalcul de la note échoué pour ${dto.restaurantId}: ${err.message}`),
    );
    return review;
  }

  // ── Restaurant owner — répondre ───────────────────────────────────────────

  async reply(reviewId: string, ownerId: string, dto: ReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { restaurant: true },
    });
    if (!review) throw new NotFoundException('Avis introuvable');
    if (review.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    if (!ESSENTIEL_TIERS.includes(review.restaurant.subscription))
      throw new ForbiddenException('Repondre aux avis est disponible a partir du pack Essentiel');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { ownerReply: dto.reply, repliedAt: new Date() },
    });
  }

  // ── Public ────────────────────────────────────────────────────────────────

  async findByRestaurant(restaurantId: string) {
    return this.prisma.review.findMany({
      where: { restaurantId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  // ── Owner — voir ses avis ─────────────────────────────────────────────────

  async findMine(ownerId: string) {
    const r = await this.prisma.restaurant.findFirst({ where: { ownerId, isActive: true } });
    if (!r) throw new NotFoundException('Restaurant introuvable');
    return this.prisma.review.findMany({
      where: { restaurantId: r.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  private async recalcRating(restaurantId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { restaurantId, isPublished: true },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        rating:      Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count,
      },
    });
  }
}

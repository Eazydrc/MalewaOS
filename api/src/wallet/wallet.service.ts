import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const POINTS_TO_FC = 50; // 20 pts = 1000 FC → 1pt = 50FC
const MIN_REDEEM   = 20; // minimum 20 points to redeem

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  // ── Get wallet summary ────────────────────────────────────────────────────

  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const redeemableFC = user.points * POINTS_TO_FC;
    const nextTier     = Math.ceil(user.points / MIN_REDEEM) * MIN_REDEEM;
    const progress     = (user.points % MIN_REDEEM) / MIN_REDEEM;

    return {
      points: user.points,
      redeemableFC,
      nextTierPoints: nextTier,
      progress,
      minRedeem: MIN_REDEEM,
    };
  }

  // ── Transaction history ───────────────────────────────────────────────────

  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pointTransaction.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ── Redeem points for FC discount ────────────────────────────────────────

  async redeem(userId: string, points: number) {
    if (points < MIN_REDEEM) {
      throw new BadRequestException(`Minimum ${MIN_REDEEM} points requis`);
    }
    if (points % MIN_REDEEM !== 0) {
      throw new BadRequestException(`Le nombre de points doit être un multiple de ${MIN_REDEEM}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new NotFoundException();
    if (user.points < points) {
      throw new BadRequestException('Solde de points insuffisant');
    }

    const amountFC = points * POINTS_TO_FC;

    const [updatedUser, tx] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data:  { points: { decrement: points } },
        select: { points: true },
      }),
      this.prisma.pointTransaction.create({
        data: {
          userId,
          amount: -points,
          type:   'REDEEM',
          reason: `Échange ${points} pts → ${amountFC.toLocaleString()} FC`,
        },
      }),
    ]);

    return {
      pointsSpent:    points,
      amountFC,
      remainingPoints: updatedUser.points,
      transaction:    tx,
    };
  }

  // ── Admin: manually award points ─────────────────────────────────────────

  async awardPoints(targetUserId: string, points: number, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const [updatedUser, tx] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data:  { points: { increment: points } },
        select: { points: true },
      }),
      this.prisma.pointTransaction.create({
        data: { userId: targetUserId, amount: points, type: 'EARN', reason },
      }),
    ]);

    return { newBalance: updatedUser.points, transaction: tx };
  }
}

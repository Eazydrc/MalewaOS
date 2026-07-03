import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReservationDto, UpdateReservationDto, UpdateStatusDto } from './dto/reservation.dto';

const RESERVATION_SELECT = {
  id: true, date: true, partySize: true, status: true, notes: true, createdAt: true,
  restaurant: {
    select: { id: true, name: true, address: true, imageUrl: true, phone: true },
  },
  user: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
  table: {
    select: { id: true, number: true, label: true, seats: true },
  },
  preOrderItems: {
    select: { id: true, menuItemId: true, name: true, priceUsdCents: true, quantity: true },
  },
};

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ── User: list own reservations ───────────────────────────────────────────

  async findByUser(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      select: RESERVATION_SELECT,
      orderBy: { date: 'desc' },
    });
  }

  // ── Restaurant: list incoming reservations ────────────────────────────────

  async findByRestaurant(restaurantId: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');
    if (role !== 'ADMIN' && restaurant.ownerId !== userId) throw new ForbiddenException();

    return this.prisma.reservation.findMany({
      where: { restaurantId },
      select: RESERVATION_SELECT,
      orderBy: { date: 'asc' },
    });
  }

  // ── Get single ────────────────────────────────────────────────────────────

  async findOne(id: string, userId: string, role: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      select: { ...RESERVATION_SELECT, restaurant: { select: { ownerId: true, id: true, name: true, address: true, imageUrl: true, phone: true } } },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const isOwner     = reservation.user.id === userId;
    const isRestaurant = reservation.restaurant.ownerId === userId;
    if (!isOwner && !isRestaurant && role !== 'ADMIN') throw new ForbiddenException();

    return reservation;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateReservationDto, userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    const date = new Date(dto.date);
    if (date < new Date()) throw new BadRequestException('La date doit être dans le futur');

    let preOrderItems: { menuItemId: string; name: string; priceUsdCents: number; quantity: number }[] = [];
    if (dto.items?.length) {
      const menuItemIds = dto.items.map((i) => i.menuItemId);
      const menuItems = await this.prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, section: { menu: { restaurantId: dto.restaurantId } } },
        select: { id: true, name: true, priceUsdCents: true, promoPrice: true },
      });
      const byId = new Map(menuItems.map((m) => [m.id, m]));
      preOrderItems = dto.items.map((i) => {
        const m = byId.get(i.menuItemId);
        if (!m) throw new BadRequestException(`Plat introuvable dans ce restaurant (${i.menuItemId})`);
        return {
          menuItemId: m.id,
          name: m.name,
          priceUsdCents: m.promoPrice ?? m.priceUsdCents,
          quantity: i.quantity,
        };
      });
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
        date,
        partySize: dto.partySize,
        notes:     dto.notes,
        status:    'PENDING',
        ...(preOrderItems.length && { preOrderItems: { create: preOrderItems } }),
      },
      select: RESERVATION_SELECT,
    });

    // Notifier le propriétaire du restaurant
    const preOrderNote = preOrderItems.length ? ` · ${preOrderItems.length} plat(s) pré-commandé(s)` : '';
    this.notifications.sendToRestaurantOwner(dto.restaurantId, {
      title: '📅 Nouvelle réservation',
      body: `${reservation.user.firstName} — ${reservation.partySize} pers. le ${new Date(reservation.date).toLocaleDateString('fr-FR')}${preOrderNote}`,
      url: '/dashboard',
    }).catch((err) => this.logger.warn(`Notification nouvelle réservation échouée (${reservation.id}): ${err.message}`));

    return reservation;
  }

  // ── Update (user can edit pending only) ───────────────────────────────────

  async update(id: string, dto: UpdateReservationDto, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.userId !== userId) throw new ForbiddenException();
    if (reservation.status !== 'PENDING') {
      throw new BadRequestException('Seules les réservations en attente peuvent être modifiées');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        ...(dto.date      && { date: new Date(dto.date) }),
        ...(dto.partySize && { partySize: dto.partySize }),
        ...(dto.notes     !== undefined && { notes: dto.notes }),
      },
      select: RESERVATION_SELECT,
    });
  }

  // ── Cancel (user) ─────────────────────────────────────────────────────────

  async cancel(id: string, userId: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Réservation introuvable');
    if (reservation.userId !== userId) throw new ForbiddenException();
    if (['CANCELLED', 'COMPLETED'].includes(reservation.status)) {
      throw new BadRequestException('Cette réservation ne peut plus être annulée');
    }

    return this.prisma.reservation.update({
      where: { id },
      data:  { status: 'CANCELLED' },
      select: RESERVATION_SELECT,
    });
  }

  // ── Assigner une table (restaurant / admin) ──────────────────────────────

  async assignTable(id: string, tableId: string | null, userId: string, role: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { restaurant: { select: { id: true, ownerId: true } } },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const isRestaurant = reservation.restaurant.ownerId === userId;
    if (!isRestaurant && !['ADMIN', 'SUPER_ADMIN'].includes(role)) throw new ForbiddenException();

    if (tableId) {
      const table = await this.prisma.restaurantTable.findUnique({ where: { id: tableId } });
      if (!table || table.restaurantId !== reservation.restaurant.id) {
        throw new NotFoundException('Table introuvable pour ce restaurant');
      }
      if (table.seats < reservation.partySize) {
        throw new BadRequestException(
          `Cette table ne compte que ${table.seats} place(s) pour ${reservation.partySize} personne(s)`,
        );
      }
    }

    return this.prisma.reservation.update({
      where: { id },
      data:  { tableId },
      select: RESERVATION_SELECT,
    });
  }

  // ── Update status (restaurant / admin) ───────────────────────────────────

  async updateStatus(id: string, dto: UpdateStatusDto, userId: string, role: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { restaurant: { select: { ownerId: true } } },
    });
    if (!reservation) throw new NotFoundException('Réservation introuvable');

    const isRestaurant = reservation.restaurant.ownerId === userId;
    if (!isRestaurant && !['ADMIN', 'SUPER_ADMIN'].includes(role)) throw new ForbiddenException();

    // Machine d'états : transitions valides uniquement
    const VALID_TRANSITIONS: Record<string, string[]> = {
      PENDING:    ['CONFIRMED', 'CANCELLED'],
      CONFIRMED:  ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
      COMPLETED:  [], // état terminal
      CANCELLED:  [], // état terminal
      NO_SHOW:    [], // état terminal
    };
    const allowed = VALID_TRANSITIONS[reservation.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition invalide : ${reservation.status} → ${dto.status}. Transitions autorisées : ${allowed.join(', ') || 'aucune'}`,
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data:  { status: dto.status },
      select: RESERVATION_SELECT,
    });

    // Attribution idempotente — on ne distribue les points que si le statut précédent n'était pas déjà COMPLETED
    if (dto.status === 'COMPLETED' && reservation.status !== 'COMPLETED') {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: reservation.userId },
          data:  { points: { increment: 10 } },
        }),
        this.prisma.pointTransaction.create({
          data: {
            userId:  reservation.userId,
            amount:  10,
            type:    'EARN',
            reason:  `Réservation complétée`,
          },
        }),
      ]);
    }

    return updated;
  }
}

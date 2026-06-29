import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersGateway } from './orders.gateway';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDriverDto, UpdateDriverLocationDto } from './dto/order.dto';

// Abonnements autorisant la commande en ligne (ESSENTIEL+ pour tous les types de restaurant)
const ORDER_TIERS = ['ESSENTIEL', 'CROISSANCE', 'DOMINATION'];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private gateway: OrdersGateway,
  ) {}

  // ── Créer une commande ────────────────────────────────────────────────────

  async create(dto: CreateOrderDto, userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId, isActive: true },
      select: { id: true, subscription: true, isOpen: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    if (!ORDER_TIERS.includes(restaurant.subscription)) {
      throw new ForbiddenException(
        `Ce restaurant ne propose pas la commande en ligne (abonnement requis : ESSENTIEL ou supérieur)`,
      );
    }
    if (!restaurant.isOpen) {
      throw new BadRequestException('Ce restaurant est actuellement fermé');
    }

    // Récupérer les prix depuis la BDD (ne jamais faire confiance au client)
    // Dédupliquer les IDs pour éviter des doubles entrées
    const itemIds = [...new Set(dto.items.map(i => i.menuItemId))];
    if (itemIds.length !== dto.items.length) {
      throw new BadRequestException('Les articles ne doivent pas être dupliqués dans la même commande');
    }

    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
        isAvailable: true,
        section: { menu: { restaurantId: dto.restaurantId } },
      },
    });

    if (menuItems.length !== itemIds.length) {
      const foundIds = new Set(menuItems.map(m => m.id));
      const missingIds = itemIds.filter(id => !foundIds.has(id));
      throw new BadRequestException(
        missingIds.length > 0
          ? `Articles indisponibles, introuvables ou n'appartenant pas à ce restaurant : ${missingIds.join(', ')}`
          : 'Items n\'appartiennent pas à ce restaurant',
      );
    }

    const priceMap = new Map(menuItems.map(m => [m.id, m]));
    let totalCents = 0;

    const orderItems = dto.items.map(i => {
      const item = priceMap.get(i.menuItemId);
      // Cette vérification ne devrait jamais échouer grâce au check ci-dessus
      if (!item) throw new BadRequestException(`Article introuvable : ${i.menuItemId}`);
      if (i.quantity < 1 || i.quantity > 50) {
        throw new BadRequestException('La quantité doit être entre 1 et 50');
      }
      // Utiliser promoPrice si défini (prix affiché au client), sinon prix normal
      const effectivePrice = item.promoPrice ?? item.priceUsdCents;
      totalCents += effectivePrice * i.quantity;
      return {
        menuItemId:    i.menuItemId,
        name:          item.name,
        priceUsdCents: effectivePrice,  // prix réellement facturé
        quantity:      i.quantity,
        notes:         i.notes,
      };
    });

    if (totalCents <= 0) {
      throw new BadRequestException('Le montant total de la commande est invalide');
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
        tableId:         dto.tableId        ?? null,
        deliveryAddress: dto.deliveryAddress ?? null,
        deliveryLat:     dto.deliveryLat     ?? null,
        deliveryLng:     dto.deliveryLng     ?? null,
        totalCents,
        notes: dto.notes,
        items: { create: orderItems },
      },
      include: {
        items: true,
        restaurant: { select: { name: true, imageUrl: true } },
        table: { select: { number: true, label: true } },
        user: { select: { firstName: true } },
      },
    });

    // Notifier le propriétaire du restaurant de la nouvelle commande
    const orderType = dto.deliveryAddress
      ? `🛵 Livraison — ${dto.deliveryAddress}`
      : order.table?.number
        ? `table ${order.table.number}`
        : '🏃 Emporter';

    this.notifications.sendToRestaurantOwner(dto.restaurantId, {
      title: '📦 Nouvelle commande',
      body: `Commande de ${order.user.firstName} — ${orderType}`,
      url: '/dashboard',
    }).catch((err) => this.logger.warn(`Notification nouvelle commande échouée (${order.id}): ${err.message}`));

    this.gateway.emitNewOrder(dto.restaurantId, order);

    return order;
  }

  // ── Mes commandes (client) ────────────────────────────────────────────────

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Commandes du restaurant ───────────────────────────────────────────────

  async findByRestaurant(restaurantId: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException();
    if (role !== 'ADMIN' && restaurant.ownerId !== userId) throw new ForbiddenException();

    return this.prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: true,
        user:  { select: { firstName: true, lastName: true, phone: true } },
        table: { select: { number: true, label: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Détail d'une commande ─────────────────────────────────────────────────

  async findOne(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, imageUrl: true, ownerId: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const isClient     = order.user.id === userId;
    const isOwner      = order.restaurant.ownerId === userId;
    if (!isClient && !isOwner && role !== 'ADMIN') throw new ForbiddenException();

    return order;
  }

  // ── Commandes du livreur ──────────────────────────────────────────────────

  async findDriverOrders(driverId: string) {
    return this.prisma.order.findMany({
      where: {
        assignedDriverId: driverId,
        status: { in: ['PACKAGING', 'OUT_FOR_DELIVERY'] },
      },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, imageUrl: true, lat: true, lng: true, address: true } },
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Assigner un livreur (restaurant/admin) ────────────────────────────────

  async assignDriver(orderId: string, dto: AssignDriverDto, ownerId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: { select: { ownerId: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (role !== 'ADMIN' && order.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    if (!['PACKAGING', 'PREPARING', 'ACCEPTED'].includes(order.status)) {
      throw new BadRequestException('Statut incompatible pour assigner un livreur');
    }

    const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
    if (!driver || driver.role !== 'LIVREUR') throw new BadRequestException('Livreur introuvable ou rôle invalide');

    return this.prisma.order.update({
      where: { id: orderId },
      data:  { assignedDriverId: dto.driverId },
      include: { items: true, assignedDriver: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } } },
    });
  }

  // ── Livreur confirme récupération au restaurant ───────────────────────────

  async driverPickup(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.assignedDriverId !== driverId) throw new ForbiddenException('Non assigné à cette commande');
    if (order.status !== 'PACKAGING') throw new BadRequestException('La commande doit être en PACKAGING');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: 'OUT_FOR_DELIVERY' },
      include: { user: { select: { id: true } }, restaurant: { select: { id: true } } },
    });

    // Notifier le client
    this.notifications.sendToUser(updated.user.id, {
      title: '🛵 Votre commande est en route !',
      body: 'Votre livreur vient de récupérer votre commande',
      url: `/track/${orderId}`,
    }).catch((err) => this.logger.warn(`Notification "en route" échouée (${orderId}): ${err.message}`));

    this.gateway.emitOrderStatus(updated.restaurant.id, updated.user.id, updated);

    return updated;
  }

  // ── Livreur confirme livraison ────────────────────────────────────────────

  async driverDeliver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.assignedDriverId !== driverId) throw new ForbiddenException('Non assigné à cette commande');
    if (order.status !== 'OUT_FOR_DELIVERY') throw new BadRequestException('La commande doit être OUT_FOR_DELIVERY');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: 'DELIVERED', driverLat: null, driverLng: null },
      include: { user: { select: { id: true } }, restaurant: { select: { id: true } } },
    });

    this.notifications.sendToUser(updated.user.id, {
      title: '✅ Commande livrée !',
      body: 'Votre commande a bien été livrée. Bon appétit !',
      url: '/commander',
    }).catch((err) => this.logger.warn(`Notification "livrée" échouée (${orderId}): ${err.message}`));

    this.gateway.emitOrderStatus(updated.restaurant.id, updated.user.id, updated);

    return updated;
  }

  // ── Livreur envoie sa position GPS ───────────────────────────────────────

  async updateDriverLocation(orderId: string, driverId: string, dto: UpdateDriverLocationDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.assignedDriverId !== driverId) throw new ForbiddenException();
    if (order.status !== 'OUT_FOR_DELIVERY') return { ok: true }; // silently ignore if not in transit

    await this.prisma.order.update({
      where: { id: orderId },
      data:  { driverLat: dto.lat, driverLng: dto.lng, driverLastSeen: new Date() },
    });
    return { ok: true };
  }

  // ── Client récupère le tracking ───────────────────────────────────────────

  async getTracking(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        assignedDriver: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        restaurant:     { select: { name: true, lat: true, lng: true, address: true } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId) throw new ForbiddenException();

    return {
      orderId:         order.id,
      status:          order.status,
      deliveryAddress: order.deliveryAddress,
      deliveryLat:     order.deliveryLat,
      deliveryLng:     order.deliveryLng,
      driverLat:       order.driverLat,
      driverLng:       order.driverLng,
      driverLastSeen:  order.driverLastSeen,
      driver:          order.assignedDriver,
      restaurant: {
        name:    order.restaurant.name,
        lat:     order.restaurant.lat,
        lng:     order.restaurant.lng,
        address: order.restaurant.address,
      },
    };
  }

  // ── Trouver les livreurs disponibles (pour le restaurant) ─────────────────

  async findAvailableDrivers() {
    return this.prisma.user.findMany({
      where: { role: 'LIVREUR', isActive: true },
      select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true },
    });
  }

  // ── Mettre à jour le statut (restaurant/admin) ────────────────────────────

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { restaurant: { select: { id: true, ownerId: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    // Le client peut annuler sa propre commande si elle est PENDING
    if (order.userId === userId && dto.status === 'CANCELLED' && order.status === 'PENDING') {
      const cancelled = await this.prisma.order.update({
        where: { id },
        data:  { status: 'CANCELLED' },
        include: { items: true },
      });
      this.gateway.emitOrderStatus(order.restaurant.id, order.userId, cancelled);
      return cancelled;
    }

    const isOwner = order.restaurant.ownerId === userId;
    if (!isOwner && role !== 'ADMIN') throw new ForbiddenException();

    const updated = await this.prisma.order.update({
      where: { id },
      data:  { status: dto.status },
      include: { items: true },
    });
    this.gateway.emitOrderStatus(order.restaurant.id, order.userId, updated);
    return updated;
  }
}

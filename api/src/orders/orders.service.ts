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

// Frais de livraison dynamiques par distance (Haversine)
// Tarif Kinshasa : base $1.00 + $0.40/km — livreur reçoit 80%
const DELIVERY_FEE_BASE_CENTS   = 100; // $1.00 minimum
const DELIVERY_FEE_PER_KM_CENTS = 40;  // $0.40/km
const DRIVER_FEE_RATIO          = 0.8; // livreur reçoit 80% des frais

function calcDeliveryFee(distanceKm: number): { clientFeeCents: number; driverEarningsCents: number } {
  const clientFeeCents     = Math.max(DELIVERY_FEE_BASE_CENTS, Math.round(DELIVERY_FEE_PER_KM_CENTS * distanceKm + DELIVERY_FEE_BASE_CENTS));
  const driverEarningsCents = Math.round(clientFeeCents * DRIVER_FEE_RATIO);
  return { clientFeeCents, driverEarningsCents };
}

// Le client peut consulter la commande via /orders/mine ; ce flag contrôle uniquement
// sa visibilité côté restaurant (transmission interdite tant qu'elle n'est pas payée)
function isHiddenFromRestaurant(order: { deliveryAddress: string | null; isPaid: boolean }) {
  return !!order.deliveryAddress && !order.isPaid;
}

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

    const isDelivery = !!dto.deliveryAddress;

    // Calcul frais livraison dynamiques selon distance restaurant → client
    let deliveryFeeUsdCents  = 0;
    let driverEarningsCents  = 0;
    if (isDelivery && restaurant) {
      const resto = await this.prisma.restaurant.findUnique({ where: { id: dto.restaurantId }, select: { lat: true, lng: true } });
      if (resto?.lat && resto?.lng && dto.deliveryLat && dto.deliveryLng) {
        const distKm = this.haversineKm(resto.lat, resto.lng, dto.deliveryLat, dto.deliveryLng);
        const fee = calcDeliveryFee(distKm);
        deliveryFeeUsdCents = fee.clientFeeCents;
        driverEarningsCents  = fee.driverEarningsCents;
      } else {
        deliveryFeeUsdCents = DELIVERY_FEE_BASE_CENTS;
        driverEarningsCents  = Math.round(DELIVERY_FEE_BASE_CENTS * DRIVER_FEE_RATIO);
      }
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
        tableId:         dto.tableId        ?? null,
        deliveryAddress: dto.deliveryAddress ?? null,
        deliveryLat:     dto.deliveryLat     ?? null,
        deliveryLng:     dto.deliveryLng     ?? null,
        deliveryFeeUsdCents,
        driverEarningsCents,
        totalCents,
        notes: dto.notes,
        verificationCode: await this.generateVerificationCode(),
        items: { create: orderItems },
      },
      include: {
        items: true,
        restaurant: { select: { name: true, imageUrl: true } },
        table: { select: { number: true, label: true } },
        user: { select: { firstName: true } },
      },
    });

    // Commande de livraison : paiement obligatoire avant transmission au restaurant —
    // on ne notifie/affiche au restaurant qu'une fois le paiement confirmé (cf. PaymentsService).
    if (isDelivery) {
      return order;
    }

    const orderType = order.table?.number ? `table ${order.table.number}` : '🏃 Emporter';

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
      select: {
        id: true, status: true, totalCents: true, deliveryFeeUsdCents: true,
        deliveryAddress: true, isPaid: true, escrowReleased: true,
        verificationCode: true, createdAt: true,
        restaurant: { select: { id: true, name: true, imageUrl: true } },
        items: { select: { id: true, name: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  // ── Commandes du restaurant ───────────────────────────────────────────────

  async findByRestaurant(restaurantId: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException();
    if (role !== 'ADMIN' && restaurant.ownerId !== userId) throw new ForbiddenException();

    return this.prisma.order.findMany({
      where: {
        restaurantId,
        // Commandes de livraison non payées : jamais transmises au restaurant
        NOT: { AND: [{ deliveryAddress: { not: null } }, { isPaid: false }] },
      },
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

    // Commande de livraison non payée : invisible pour le restaurant tant que non transmise
    if (isOwner && role !== 'ADMIN' && isHiddenFromRestaurant(order)) {
      throw new NotFoundException('Commande introuvable');
    }

    return order;
  }

  // ── Commandes du client ───────────────────────────────────────────────────

  async findClientOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      select: {
        id: true, status: true, totalCents: true, deliveryFeeUsdCents: true,
        deliveryAddress: true, isPaid: true, escrowReleased: true,
        verificationCode: true, createdAt: true,
        restaurant: { select: { id: true, name: true, imageUrl: true } },
        items: { select: { id: true, name: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  // ── Commandes du livreur ──────────────────────────────────────────────────

  async findDriverOrders(driverId: string) {
    return this.prisma.order.findMany({
      where: {
        assignedDriverId: driverId,
        OR: [
          { status: { in: ['PACKAGING', 'OUT_FOR_DELIVERY'] } },
          { status: 'DELIVERED', escrowReleased: false },
        ],
      },
      select: {
        id: true, status: true, totalCents: true, notes: true,
        deliveryAddress: true, deliveryLat: true, deliveryLng: true,
        verificationCode: true, escrowReleased: true, createdAt: true,
        items: { select: { id: true, name: true, quantity: true, priceUsdCents: true } },
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

  // ── Matching livreur — broadcast aux livreurs proches (façon Yango) ───────

  // Suivi en mémoire des livreurs notifiés par commande (assez pour la durée du broadcast)
  private readonly broadcastedDrivers = new Map<string, string[]>();

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Restaurant clique "Chercher un livreur" — diffuse aux livreurs disponibles dans 1km */
  async findDriver(orderId: string, ownerId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, user: { select: { firstName: true, lastName: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (role !== 'ADMIN' && order.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    if (!order.deliveryAddress) throw new BadRequestException('Cette commande n\'est pas une livraison');
    if (order.assignedDriverId) throw new BadRequestException('Un livreur est déjà assigné');
    if (!['READY', 'PACKAGING'].includes(order.status)) {
      throw new BadRequestException('La commande doit être prête avant de chercher un livreur');
    }
    if (order.restaurant.lat == null || order.restaurant.lng == null) {
      throw new BadRequestException('Localisation du restaurant non configurée');
    }

    const candidates = await this.prisma.user.findMany({
      where: { role: 'LIVREUR', isActive: true, isAvailableForDelivery: true, currentLat: { not: null }, currentLng: { not: null } },
      select: { id: true, firstName: true, lastName: true, currentLat: true, currentLng: true },
    });

    const nearby = candidates.filter(d =>
      this.haversineKm(order.restaurant.lat!, order.restaurant.lng!, d.currentLat!, d.currentLng!) <= 1,
    );

    if (nearby.length === 0) {
      throw new BadRequestException('Aucun livreur disponible à proximité pour le moment');
    }

    await this.prisma.order.update({ where: { id: orderId }, data: { searchingDriver: true } });

    const driverIds = nearby.map(d => d.id);
    this.broadcastedDrivers.set(orderId, driverIds);

    this.gateway.broadcastDeliveryRequest(driverIds, {
      orderId,
      restaurantName:      order.restaurant.name,
      restaurantLat:       order.restaurant.lat,
      restaurantLng:       order.restaurant.lng,
      deliveryAddress:     order.deliveryAddress,
      deliveryLat:         order.deliveryLat,
      deliveryLng:         order.deliveryLng,
      deliveryFeeUsdCents: order.deliveryFeeUsdCents,
      driverEarningsCents: order.driverEarningsCents,
      clientName:          order.user.firstName,
    });

    return { driversNotified: nearby.length };
  }

  /** Le premier livreur qui accepte gagne — opération atomique */
  async acceptDeliveryRequest(orderId: string, driverId: string) {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver || driver.role !== 'LIVREUR') throw new ForbiddenException();

    const result = await this.prisma.order.updateMany({
      where: { id: orderId, assignedDriverId: null, searchingDriver: true },
      data:  { assignedDriverId: driverId, searchingDriver: false },
    });
    if (result.count === 0) {
      throw new BadRequestException('Cette livraison a déjà été prise par un autre livreur');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        restaurant: { select: { id: true, ownerId: true } },
        assignedDriver: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const notifiedDrivers = this.broadcastedDrivers.get(orderId) ?? [];
    this.gateway.notifyDeliveryTaken(notifiedDrivers, orderId, driverId);
    this.broadcastedDrivers.delete(orderId);

    this.gateway.emitOrderStatus(order.restaurant.id, order.userId, order);
    return order;
  }

  // ── Disponibilité livreur (toggle + position périodique) ─────────────────

  async setDriverAvailability(driverId: string, isAvailable: boolean, lat?: number, lng?: number) {
    return this.prisma.user.update({
      where: { id: driverId },
      data: {
        isAvailableForDelivery: isAvailable,
        ...(lat !== undefined ? { currentLat: lat } : {}),
        ...(lng !== undefined ? { currentLng: lng } : {}),
        availabilityUpdatedAt: new Date(),
      },
      select: { id: true, isAvailableForDelivery: true },
    });
  }

  // ── Livreur scanne le code restaurant → débloque adresse client ─────────

  async driverScanPickup(orderId: string, driverId: string, code: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true } }, restaurant: { select: { id: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.assignedDriverId !== driverId) throw new ForbiddenException('Non assigné à cette commande');
    if (!['PACKAGING', 'OUT_FOR_DELIVERY'].includes(order.status)) {
      throw new BadRequestException('La commande doit être en PACKAGING');
    }
    if (!code?.trim() || code.trim() !== order.verificationCode) {
      throw new BadRequestException('Code commande invalide');
    }

    // Génère le deliveryCode si pas encore fait
    let deliveryCode = order.deliveryCode;
    if (!deliveryCode) {
      deliveryCode = await this.generateDeliveryCode();
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: 'OUT_FOR_DELIVERY', deliveryCode },
      include: { user: { select: { id: true } }, restaurant: { select: { id: true } } },
    });

    this.notifications.sendToUser(updated.user.id, {
      title: '🛵 Votre commande est en route !',
      body: 'Votre livreur a récupéré votre commande et se dirige vers vous',
      url: `/track/${orderId}`,
    }).catch((err) => this.logger.warn(`Notification "en route" échouée (${orderId}): ${err.message}`));

    this.gateway.emitOrderStatus(updated.restaurant.id, updated.user.id, updated);

    return {
      deliveryAddress: order.deliveryAddress,
      deliveryLat: order.deliveryLat,
      deliveryLng: order.deliveryLng,
      deliveryCode,
      clientName: '',
    };
  }

  // ── Client confirme réception (code du livreur) → DELIVERED + séquestre libéré ──

  async confirmDelivery(orderId: string, userId: string, code: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: { select: { id: true, ownerId: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId) throw new ForbiddenException();
    if (!order.deliveryAddress) throw new BadRequestException('Cette commande n\'est pas une livraison');
    if (!order.isPaid) throw new BadRequestException('Cette commande n\'a pas encore été payée');
    if (!['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException('La commande doit être en livraison');
    }
    if (order.escrowReleased) return order;
    if (!code?.trim() || code.trim() !== order.deliveryCode) {
      throw new BadRequestException('Code de livraison invalide');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: 'DELIVERED', escrowReleased: true, escrowReleasedAt: new Date(), driverLat: null, driverLng: null },
    });

    this.notifications.sendToRestaurantOwner(order.restaurant.id, {
      title: '💰 Commande livrée & fonds débloqués',
      body: 'Le client a confirmé la réception — les fonds sont disponibles',
      url: '/dashboard',
    }).catch((err) => this.logger.warn(`Notification déblocage échouée (${orderId}): ${err.message}`));

    this.gateway.emitOrderStatus(order.restaurant.id, order.userId, updated);
    return updated;
  }

  // ── Client signale un problème ────────────────────────────────────────────

  async reportProblem(orderId: string, userId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: { select: { id: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.userId !== userId) throw new ForbiddenException();
    if (!reason?.trim() || reason.trim().length < 10) {
      throw new BadRequestException('Motif obligatoire (10 caractères minimum)');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { problemReport: reason.trim(), problemReportedAt: new Date() },
    });

    this.notifications.sendToRestaurantOwner(order.restaurant.id, {
      title: '⚠️ Problème signalé par le client',
      body: reason.trim().slice(0, 80),
      url: '/dashboard',
    }).catch(() => {});

    return updated;
  }

  private async generateDeliveryCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await this.prisma.order.findUnique({ where: { deliveryCode: code } });
      if (!existing) return code;
    }
    throw new Error('Impossible de générer un code de livraison unique');
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
      verificationCode:  order.verificationCode,
      deliveryCode:      order.deliveryCode,
      escrowReleased:    order.escrowReleased,
      isPaid:            order.isPaid,
      problemReport:     order.problemReport,
      problemReportedAt: order.problemReportedAt,
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
    if (role !== 'ADMIN' && isHiddenFromRestaurant(order)) {
      throw new BadRequestException('Cette commande de livraison n\'a pas encore été payée');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data:  { status: dto.status },
      include: { items: true },
    });
    this.gateway.emitOrderStatus(order.restaurant.id, order.userId, updated);
    return updated;
  }

  // ── Refuser une commande (restaurant/admin) — motif obligatoire ──────────

  async refuse(id: string, reason: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { restaurant: { select: { id: true, ownerId: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const isOwner = order.restaurant.ownerId === userId;
    if (!isOwner && role !== 'ADMIN') throw new ForbiddenException();
    if (role !== 'ADMIN' && isHiddenFromRestaurant(order)) {
      throw new BadRequestException('Cette commande de livraison n\'a pas encore été payée');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Seules les commandes en attente peuvent être refusées');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('Le motif de refus est obligatoire');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data:  { status: 'CANCELLED', refusalReason: reason.trim() },
      include: { items: true },
    });

    this.notifications.sendToUser(order.userId, {
      title: '❌ Commande refusée',
      body: `Motif : ${reason.trim()}`,
      url: '/commander',
    }).catch((err) => this.logger.warn(`Notification refus échouée (${id}): ${err.message}`));

    this.gateway.emitOrderStatus(order.restaurant.id, order.userId, updated);
    return updated;
  }

  // ── Marketplace livreur : lister toutes les demandes disponibles ─────────

  async getDeliveryRequests(driverId: string) {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const orders = await this.prisma.order.findMany({
      where: {
        deliveryAddress: { not: null },
        isPaid: true,
        status: 'PACKAGING',
        assignedDriverId: null,
        OR: [
          { claimedByDriverId: null },
          { claimedByDriverId: driverId },
          { claimedAt: { lt: tenMinutesAgo } }, // claim expiré
        ],
      },
      select: {
        id: true, status: true, deliveryAddress: true, deliveryLat: true, deliveryLng: true,
        deliveryFeeUsdCents: true, driverEarningsCents: true, createdAt: true,
        claimedByDriverId: true, claimedAt: true,
        restaurant: { select: { id: true, name: true, imageUrl: true, lat: true, lng: true, address: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    // Marquer celles qui sont grisées (prises par quelqu'un d'autre, encore dans la fenêtre de 10 min)
    return orders.map(o => ({
      ...o,
      isClaimed: !!o.claimedByDriverId && o.claimedByDriverId !== driverId && o.claimedAt && o.claimedAt > tenMinutesAgo,
      isClaimedByMe: o.claimedByDriverId === driverId,
    }));
  }

  // ── Livreur réserve une demande (10 min) ─────────────────────────────────

  async claimDelivery(orderId: string, driverId: string) {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const result = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: 'PACKAGING',
        isPaid: true,
        assignedDriverId: null,
        OR: [
          { claimedByDriverId: null },
          { claimedAt: { lt: tenMinutesAgo } },
          { claimedByDriverId: driverId },
        ],
      },
      data: { claimedByDriverId: driverId, claimedAt: now },
    });

    if (result.count === 0) {
      throw new BadRequestException('Cette livraison est déjà réservée par un autre livreur');
    }
    return { ok: true };
  }

  // ── Stats journalières + mensuelles du livreur ───────────────────────────

  async getDriverStats(driverId: string) {
    const now        = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayDeliveries, weekDeliveries, monthDeliveries] = await Promise.all([
      this.prisma.order.findMany({
        where: { assignedDriverId: driverId, status: 'DELIVERED', escrowReleasedAt: { gte: todayStart } },
        select: { id: true, driverEarningsCents: true, restaurant: { select: { name: true } }, escrowReleasedAt: true },
        orderBy: { escrowReleasedAt: 'desc' },
      }),
      this.prisma.order.findMany({
        where: { assignedDriverId: driverId, status: 'DELIVERED', escrowReleasedAt: { gte: weekStart } },
        select: { id: true, driverEarningsCents: true },
      }),
      this.prisma.order.findMany({
        where: { assignedDriverId: driverId, status: 'DELIVERED', escrowReleasedAt: { gte: monthStart } },
        select: { id: true, driverEarningsCents: true },
      }),
    ]);

    return {
      today: {
        count:         todayDeliveries.length,
        earningsCents: todayDeliveries.reduce((s, o) => s + o.driverEarningsCents, 0),
        deliveries:    todayDeliveries,
      },
      week: {
        count:         weekDeliveries.length,
        earningsCents: weekDeliveries.reduce((s, o) => s + o.driverEarningsCents, 0),
      },
      month: {
        count:         monthDeliveries.length,
        earningsCents: monthDeliveries.reduce((s, o) => s + o.driverEarningsCents, 0),
      },
    };
  }

  // ── Affiliation livreur ↔ restaurant ─────────────────────────────────────

  async joinAffiliation(driverId: string, code: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { affiliationCode: code } });
    if (!restaurant) throw new NotFoundException('Code d\'affiliation invalide');

    await this.prisma.driverAffiliation.upsert({
      where:  { driverId_restaurantId: { driverId, restaurantId: restaurant.id } },
      update: {},
      create: { id: `aff-${driverId}-${restaurant.id}`, driverId, restaurantId: restaurant.id },
    });
    return { restaurantName: restaurant.name, restaurantId: restaurant.id };
  }

  async leaveAffiliation(driverId: string, restaurantId: string) {
    await this.prisma.driverAffiliation.deleteMany({ where: { driverId, restaurantId } });
    return { ok: true };
  }

  async getDriverAffiliations(driverId: string) {
    return this.prisma.driverAffiliation.findMany({
      where: { driverId },
      include: { restaurant: { select: { id: true, name: true, imageUrl: true, address: true } } },
    });
  }

  // ── Restaurant : générer / obtenir son code d'affiliation ────────────────

  async getOrCreateAffiliationCode(restaurantId: string, ownerId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');
    if (role !== 'ADMIN' && restaurant.ownerId !== ownerId) throw new ForbiddenException();

    if (restaurant.affiliationCode) return { code: restaurant.affiliationCode };

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data:  { affiliationCode: code },
    });
    return { code: updated.affiliationCode! };
  }

  async getRestaurantAffiliatedDrivers(restaurantId: string, ownerId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException();
    if (role !== 'ADMIN' && restaurant.ownerId !== ownerId) throw new ForbiddenException();

    return this.prisma.driverAffiliation.findMany({
      where: { restaurantId },
      include: { driver: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true, isAvailableForDelivery: true } } },
    });
  }

  // ── Génère un code de vérification unique (retrait + livraison) ──────────

  private async generateVerificationCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await this.prisma.order.findUnique({ where: { verificationCode: code } });
      if (!existing) return code;
    }
    throw new Error('Impossible de générer un code de vérification unique');
  }
}

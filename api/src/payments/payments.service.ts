import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersGateway } from '../orders/orders.gateway';
import { randomBytes } from 'crypto';
import { SubscriptionTier, TIER_PRICES, PaymentMethod, CinetPayWebhookDto } from './dto/payment.dto';

function channelsFor(method?: PaymentMethod) {
  if (method === PaymentMethod.CARD) return 'CREDIT_CARD';
  if (method === PaymentMethod.MOBILE_MONEY) return 'MOBILE_MONEY';
  return 'ALL';
}

// Statuts de commande considérés comme "dues" (à payer)
const PAYABLE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'PACKAGING', 'OUT_FOR_DELIVERY', 'READY', 'DELIVERED'];

// Taux approximatif USD→CDF
const USD_TO_CDF = 2800;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly apiKey: string;
  private readonly siteId: string;
  private readonly notifyUrl: string;
  private readonly returnUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
    private gateway: OrdersGateway,
  ) {
    this.apiKey    = config.get('CINETPAY_API_KEY') ?? '';
    this.siteId    = config.get('CINETPAY_SITE_ID') ?? '';

    const backendUrl  = config.get('BACKEND_URL') ?? 'http://localhost:3001';
    const frontendUrl = config.get('FRONTEND_URL') ?? 'http://localhost:4000';

    this.notifyUrl = `${backendUrl}/api/v1/payments/webhook`;
    this.returnUrl = `${frontendUrl}/abonnement?status=success`;
  }

  // ─────────────────────────────────────────────
  // Initier un paiement CinetPay
  // ─────────────────────────────────────────────

  async initiatePayment(ownerId: string, tier: SubscriptionTier, phone?: string, method?: PaymentMethod) {
    const amountUsd = TIER_PRICES[tier];
    if (!amountUsd) throw new BadRequestException('Tier invalide');

    const restaurant = await this.prisma.restaurant.findFirst({ where: { ownerId } });
    if (!restaurant) throw new BadRequestException('Restaurant introuvable');

    const amountCdf   = Math.round((amountUsd / 100) * USD_TO_CDF);
    const transactionId = `ELENGI-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    // Enregistrer la transaction en PENDING
    await this.prisma.paymentTransaction.create({
      data: {
        restaurantId: restaurant.id,
        userId:       ownerId,
        tier,
        amountUsd,
        transactionId,
        status: 'PENDING',
      },
    });

    // Mode dev : simuler succès immédiat si API key non configurée
    if (!this.apiKey || this.apiKey === 'YOUR_CINETPAY_API_KEY') {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException(
          'CinetPay non configuré : CINETPAY_API_KEY manquante ou invalide en production',
        );
      }
      this.logger.warn('CinetPay non configuré — simulation paiement réussi');
      await this.handleSuccess(transactionId);
      return { devMode: true, message: 'Paiement simulé (dev)', tier, transactionId };
    }

    // Appel API CinetPay (Mobile Money CDF)
    const payload = {
      apikey:                this.apiKey,
      site_id:               this.siteId,
      transaction_id:        transactionId,
      amount:                amountCdf,
      currency:              'CDF',
      description:           `Abonnement Elengi — Pack ${tier}`,
      notify_url:            this.notifyUrl,
      return_url:            this.returnUrl,
      channels:              channelsFor(method),
      metadata:              JSON.stringify({ userId: ownerId, restaurantId: restaurant.id, tier }),
      ...(phone ? { customer_phone_number: phone } : {}),
    };

    const res  = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      code?: string;
      message?: string;
      data?: { payment_url?: string };
    };

    if (data.code !== '201') {
      this.logger.error('CinetPay error', data);
      throw new BadRequestException(data.message ?? 'Erreur CinetPay');
    }

    return { paymentUrl: data.data?.payment_url, transactionId };
  }

  // ─────────────────────────────────────────────
  // Commandes du jour à payer (client, dans un restaurant)
  // ─────────────────────────────────────────────

  async getOrdersDue(userId: string, restaurantId: string, orderId?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        restaurantId,
        isPaid: false,
        status: { in: PAYABLE_STATUSES as any },
        ...(orderId ? { id: orderId } : { createdAt: { gte: startOfDay } }),
      },
      select: { id: true, totalCents: true, deliveryFeeUsdCents: true },
    });

    return {
      orderIds:   orders.map(o => o.id),
      totalCents: orders.reduce((sum, o) => sum + o.totalCents + o.deliveryFeeUsdCents, 0),
      count:      orders.length,
    };
  }

  // ─────────────────────────────────────────────
  // Initier le paiement d'une commande précise, ou de toutes celles dues du jour
  // ─────────────────────────────────────────────

  async initiateOrderPayment(userId: string, restaurantId: string, phone?: string, method?: PaymentMethod, orderId?: string) {
    const due = await this.getOrdersDue(userId, restaurantId, orderId);
    if (due.count === 0) throw new BadRequestException('Aucune commande à payer');

    const amountUsd  = due.totalCents;
    const amountCdf  = Math.round((amountUsd / 100) * USD_TO_CDF);
    const transactionId = `ELENGI-ORD-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    await this.prisma.orderPaymentTransaction.create({
      data: {
        restaurantId,
        userId,
        orderIds: due.orderIds,
        amountUsd,
        transactionId,
        status: 'PENDING',
      },
    });

    if (!this.apiKey || this.apiKey === 'YOUR_CINETPAY_API_KEY') {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException(
          'CinetPay non configuré : CINETPAY_API_KEY manquante ou invalide en production',
        );
      }
      this.logger.warn('CinetPay non configuré — simulation paiement commandes réussi');
      await this.handleOrderPaymentSuccess(transactionId);
      return { devMode: true, message: 'Paiement simulé (dev)', amountUsd, transactionId };
    }

    const payload = {
      apikey:                this.apiKey,
      site_id:               this.siteId,
      transaction_id:        transactionId,
      amount:                amountCdf,
      currency:              'CDF',
      description:           `Elengi — règlement commande(s) restaurant`,
      notify_url:            this.notifyUrl,
      return_url:            this.returnUrl,
      channels:              channelsFor(method),
      metadata:              JSON.stringify({ userId, restaurantId, orderIds: due.orderIds }),
      ...(phone ? { customer_phone_number: phone } : {}),
    };

    const res  = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      code?: string;
      message?: string;
      data?: { payment_url?: string };
    };

    if (data.code !== '201') {
      this.logger.error('CinetPay error', data);
      throw new BadRequestException(data.message ?? 'Erreur CinetPay');
    }

    return { paymentUrl: data.data?.payment_url, transactionId };
  }

  // ─────────────────────────────────────────────
  // Webhook CinetPay
  // ─────────────────────────────────────────────

  async handleWebhook(dto: CinetPayWebhookDto) {
    const transactionId = dto.cpm_trans_id ?? dto.transaction_id;
    if (!transactionId) {
      this.logger.warn('Webhook reçu sans transaction_id');
      return { message: 'ignored' };
    }

    // Paiement de commande(s) ?
    const orderTx = await this.prisma.orderPaymentTransaction.findUnique({ where: { transactionId } });
    if (orderTx) return this.handleOrderPaymentWebhook(transactionId, orderTx);

    const tx = await this.prisma.paymentTransaction.findUnique({ where: { transactionId } });
    if (!tx) {
      this.logger.warn(`Webhook pour transaction inconnue : ${transactionId}`);
      return { message: 'ignored' };
    }

    // Mode dev sans CinetPay configuré : on ne peut pas vérifier auprès de l'API,
    // on se contente du statut "PENDING" géré par initiatePayment (simulation).
    if (!this.apiKey || this.apiKey === 'YOUR_CINETPAY_API_KEY') {
      this.logger.warn('CinetPay non configuré — webhook ignoré (vérification impossible)');
      return { message: 'ignored' };
    }

    // Ne jamais faire confiance au payload du webhook : revérifier auprès de
    // l'API CinetPay (statut + montant + devise) avant toute action.
    const verif = await this.verifyTransaction(transactionId);
    if (!verif) {
      this.logger.warn(`Vérification CinetPay impossible pour ${transactionId}`);
      return { message: 'ignored' };
    }

    if (verif.status !== 'SUCCESS') {
      await this.prisma.paymentTransaction.updateMany({
        where: { transactionId },
        data:  { status: 'FAILED' },
      });
      this.logger.warn(`Paiement échoué (vérifié) : ${transactionId}`);
      return { message: 'OK' };
    }

    // Vérifier que le montant payé correspond au montant attendu pour ce tier
    const expectedCdf = Math.round((tx.amountUsd / 100) * USD_TO_CDF);
    if (Math.abs(verif.amount - expectedCdf) > 1 || verif.currency !== 'CDF') {
      this.logger.error(
        `Montant invalide pour ${transactionId} : attendu ${expectedCdf} CDF, reçu ${verif.amount} ${verif.currency}`,
      );
      await this.prisma.paymentTransaction.updateMany({
        where: { transactionId },
        data:  { status: 'FAILED' },
      });
      return { message: 'OK' };
    }

    await this.handleSuccess(transactionId);
    return { message: 'OK' };
  }

  // ─────────────────────────────────────────────
  // Webhook : paiement de commande(s)
  // ─────────────────────────────────────────────

  private async handleOrderPaymentWebhook(
    transactionId: string,
    tx: { amountUsd: number },
  ) {
    if (!this.apiKey || this.apiKey === 'YOUR_CINETPAY_API_KEY') {
      this.logger.warn('CinetPay non configuré — webhook commande ignoré (vérification impossible)');
      return { message: 'ignored' };
    }

    const verif = await this.verifyTransaction(transactionId);
    if (!verif) {
      this.logger.warn(`Vérification CinetPay impossible pour ${transactionId}`);
      return { message: 'ignored' };
    }

    if (verif.status !== 'SUCCESS') {
      await this.prisma.orderPaymentTransaction.updateMany({
        where: { transactionId },
        data:  { status: 'FAILED' },
      });
      this.logger.warn(`Paiement commande échoué (vérifié) : ${transactionId}`);
      return { message: 'OK' };
    }

    const expectedCdf = Math.round((tx.amountUsd / 100) * USD_TO_CDF);
    if (Math.abs(verif.amount - expectedCdf) > 1 || verif.currency !== 'CDF') {
      this.logger.error(
        `Montant invalide pour ${transactionId} : attendu ${expectedCdf} CDF, reçu ${verif.amount} ${verif.currency}`,
      );
      await this.prisma.orderPaymentTransaction.updateMany({
        where: { transactionId },
        data:  { status: 'FAILED' },
      });
      return { message: 'OK' };
    }

    await this.handleOrderPaymentSuccess(transactionId);
    return { message: 'OK' };
  }

  private async handleOrderPaymentSuccess(transactionId: string) {
    const tx = await this.prisma.orderPaymentTransaction.findUnique({ where: { transactionId } });
    if (!tx) {
      this.logger.warn(`Transaction commande introuvable : ${transactionId}`);
      return;
    }
    if (tx.status === 'SUCCESS') {
      this.logger.log(`Transaction commande déjà traitée : ${transactionId}`);
      return; // idempotent
    }

    await this.prisma.$transaction([
      this.prisma.orderPaymentTransaction.update({
        where: { transactionId },
        data:  { status: 'SUCCESS' },
      }),
      this.prisma.order.updateMany({
        where: { id: { in: tx.orderIds } },
        data:  { isPaid: true, paidAt: new Date() },
      }),
    ]);

    await this.awardPoints(tx.userId, tx.amountUsd, 'Paiement de commande(s)');

    // Commandes de livraison : maintenant payées, on les transmet enfin au restaurant
    const deliveryOrders = await this.prisma.order.findMany({
      where: { id: { in: tx.orderIds }, deliveryAddress: { not: null } },
      include: {
        items: true,
        restaurant: { select: { id: true } },
        table: { select: { number: true, label: true } },
        user: { select: { firstName: true } },
      },
    });
    for (const order of deliveryOrders) {
      this.notifications.sendToRestaurantOwner(order.restaurantId, {
        title: '📦 Nouvelle commande (livraison payée)',
        body: `Commande de ${order.user.firstName} — 🛵 Livraison — ${order.deliveryAddress}`,
        url: '/dashboard',
      }).catch((err) => this.logger.warn(`Notification commande livraison payée échouée (${order.id}): ${err.message}`));
      this.gateway.emitNewOrder(order.restaurant.id, order);
    }

    this.logger.log(`Commandes payées (${tx.orderIds.length}) pour transaction ${transactionId}`);
  }

  // ─────────────────────────────────────────────
  // Marquer une commande payée en espèces (restaurant)
  // ─────────────────────────────────────────────

  async markOrderPaidCash(orderId: string, actorId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: { select: { ownerId: true } } },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const isOwner = order.restaurant.ownerId === actorId;
    if (!isOwner && role !== 'ADMIN') throw new ForbiddenException();
    if (order.deliveryAddress) {
      throw new BadRequestException('Les commandes en livraison doivent être payées en ligne avant transmission (séquestre)');
    }

    if (order.isPaid) return order; // idempotent

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { isPaid: true, paidAt: new Date() },
    });

    await this.awardPoints(order.userId, order.totalCents, 'Paiement en espèces');

    return updated;
  }

  // ─────────────────────────────────────────────
  // Attribution de points fidélité (1 point par $1 dépensé)
  // ─────────────────────────────────────────────

  private async awardPoints(userId: string, amountCents: number, reason: string) {
    const points = Math.floor(amountCents / 100);
    if (points <= 0) return;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data:  { points: { increment: points } },
      }),
      this.prisma.pointTransaction.create({
        data: { userId, amount: points, type: 'EARN', reason },
      }),
    ]);
  }

  // ─────────────────────────────────────────────
  // Vérification serveur-à-serveur du statut réel d'une transaction
  // (ne jamais se fier au seul contenu du webhook)
  // ─────────────────────────────────────────────

  private async verifyTransaction(
    transactionId: string,
  ): Promise<{ status: 'SUCCESS' | 'FAILED'; amount: number; currency: string } | null> {
    try {
      const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey:         this.apiKey,
          site_id:        this.siteId,
          transaction_id: transactionId,
        }),
      });
      const data = (await res.json()) as {
        code?: string;
        data?: { status?: string; amount?: string | number; currency?: string };
      };

      if (data.code !== '00' || !data.data) {
        this.logger.warn(`Réponse vérification CinetPay inattendue pour ${transactionId}`, data);
        return null;
      }

      return {
        status:   data.data.status === 'ACCEPTED' ? 'SUCCESS' : 'FAILED',
        amount:   Number(data.data.amount ?? 0),
        currency: data.data.currency ?? '',
      };
    } catch (err) {
      this.logger.error(`Erreur vérification CinetPay pour ${transactionId}`, err as Error);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // Traitement succès : upgrade subscription
  // ─────────────────────────────────────────────

  private async handleSuccess(transactionId: string) {
    const tx = await this.prisma.paymentTransaction.findUnique({ where: { transactionId } });
    if (!tx) {
      this.logger.warn(`Transaction introuvable : ${transactionId}`);
      return;
    }
    if (tx.status === 'SUCCESS') {
      this.logger.log(`Transaction déjà traitée : ${transactionId}`);
      return; // idempotent
    }

    await this.prisma.$transaction([
      this.prisma.paymentTransaction.update({
        where: { transactionId },
        data:  { status: 'SUCCESS' },
      }),
      this.prisma.restaurant.update({
        where: { id: tx.restaurantId },
        data:  { subscription: tx.tier as SubscriptionTier },
      }),
    ]);

    this.logger.log(`Restaurant ${tx.restaurantId} upgradé vers ${tx.tier}`);
  }

  // ─────────────────────────────────────────────
  // Historique des paiements du restaurant
  // ─────────────────────────────────────────────

  async getHistory(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { ownerId } });
    if (!restaurant) return [];

    return this.prisma.paymentTransaction.findMany({
      where:   { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    });
  }
}

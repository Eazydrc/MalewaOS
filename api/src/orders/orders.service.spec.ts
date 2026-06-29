import { OrdersService } from './orders.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('OrdersService', () => {
  let prisma: any;
  let notifications: any;
  let gateway: any;
  let service: OrdersService;

  beforeEach(() => {
    prisma = {
      restaurant: { findUnique: jest.fn() },
      menuItem: { findMany: jest.fn() },
      order: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      user: { findMany: jest.fn(), findUnique: jest.fn() },
    };
    notifications = {
      sendToRestaurantOwner: jest.fn().mockResolvedValue(undefined),
      sendToUser: jest.fn().mockResolvedValue(undefined),
    };
    gateway = {
      emitNewOrder: jest.fn(),
      emitOrderStatus: jest.fn(),
    };
    service = new OrdersService(prisma, notifications, gateway);
  });

  describe('create', () => {
    const dto = {
      restaurantId: 'resto-1',
      items: [{ menuItemId: 'item-1', quantity: 2 }],
    } as any;

    it('rejette si le restaurant est introuvable', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.create(dto, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('rejette si le restaurant n\'a pas un abonnement suffisant', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'resto-1', subscription: 'MAMAN', isOpen: true });
      await expect(service.create(dto, 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('rejette si le restaurant est fermé', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'resto-1', subscription: 'ESSENTIEL', isOpen: false });
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('rejette si des articles sont dupliqués', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'resto-1', subscription: 'ESSENTIEL', isOpen: true });
      const dupDto = { restaurantId: 'resto-1', items: [{ menuItemId: 'item-1', quantity: 1 }, { menuItemId: 'item-1', quantity: 1 }] } as any;
      await expect(service.create(dupDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('rejette si un article est introuvable ou indisponible', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'resto-1', subscription: 'ESSENTIEL', isOpen: true });
      prisma.menuItem.findMany.mockResolvedValue([]);
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('calcule le total en utilisant le promoPrice si présent et crée la commande', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'resto-1', subscription: 'ESSENTIEL', isOpen: true });
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'item-1', name: 'Pizza', priceUsdCents: 1000, promoPrice: 800 },
      ]);
      prisma.order.create.mockResolvedValue({
        id: 'order-1',
        user: { firstName: 'Jean' },
        table: null,
      });

      const result = await service.create(dto, 'user-1');

      expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          totalCents: 1600, // 800 * 2
          items: { create: [expect.objectContaining({ priceUsdCents: 800, quantity: 2 })] },
        }),
      }));
      expect(result.id).toBe('order-1');
      expect(notifications.sendToRestaurantOwner).toHaveBeenCalled();
    });

    it('rejette une quantité hors limites', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'resto-1', subscription: 'ESSENTIEL', isOpen: true });
      prisma.menuItem.findMany.mockResolvedValue([
        { id: 'item-1', name: 'Pizza', priceUsdCents: 1000, promoPrice: null },
      ]);
      const badDto = { restaurantId: 'resto-1', items: [{ menuItemId: 'item-1', quantity: 100 }] } as any;
      await expect(service.create(badDto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('rejette si la commande est introuvable', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('order-1', 'user-1', 'CLIENT')).rejects.toThrow(NotFoundException);
    });

    it('rejette si l\'utilisateur n\'est ni le client, ni le propriétaire, ni admin', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        user: { id: 'other-user' },
        restaurant: { ownerId: 'other-owner' },
      });
      await expect(service.findOne('order-1', 'user-1', 'CLIENT')).rejects.toThrow(ForbiddenException);
    });

    it('autorise le client propriétaire de la commande', async () => {
      const order = { id: 'order-1', user: { id: 'user-1' }, restaurant: { ownerId: 'other-owner' } };
      prisma.order.findUnique.mockResolvedValue(order);
      const result = await service.findOne('order-1', 'user-1', 'CLIENT');
      expect(result).toBe(order);
    });
  });

  describe('updateStatus', () => {
    it('permet au client d\'annuler sa propre commande PENDING', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'PENDING', restaurant: { ownerId: 'owner-1' },
      });
      prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });

      const result = await service.updateStatus('order-1', { status: 'CANCELLED' } as any, 'user-1', 'CLIENT');

      expect(result.status).toBe('CANCELLED');
    });

    it('rejette un utilisateur non autorisé', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'ACCEPTED', restaurant: { ownerId: 'owner-1' },
      });
      await expect(service.updateStatus('order-1', { status: 'PREPARING' } as any, 'random-user', 'CLIENT'))
        .rejects.toThrow(ForbiddenException);
    });

    it('permet au propriétaire de mettre à jour le statut', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1', userId: 'user-1', status: 'ACCEPTED', restaurant: { ownerId: 'owner-1' },
      });
      prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'PREPARING' });

      const result = await service.updateStatus('order-1', { status: 'PREPARING' } as any, 'owner-1', 'RESTAURANT');

      expect(result.status).toBe('PREPARING');
    });
  });
});

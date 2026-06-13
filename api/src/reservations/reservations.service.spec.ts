import { ReservationsService } from './reservations.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('ReservationsService', () => {
  let prisma: any;
  let notifications: any;
  let service: ReservationsService;

  beforeEach(() => {
    prisma = {
      restaurant: { findUnique: jest.fn() },
      reservation: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      user: { update: jest.fn() },
      pointTransaction: { create: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    notifications = {
      sendToRestaurantOwner: jest.fn().mockResolvedValue(undefined),
    };
    service = new ReservationsService(prisma, notifications);
  });

  describe('create', () => {
    it('rejette si le restaurant est introuvable', async () => {
      prisma.restaurant.findUnique.mockResolvedValue(null);
      await expect(service.create({ restaurantId: 'r1', date: new Date(Date.now() + 86400000).toISOString(), partySize: 2 } as any, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('rejette si la date est dans le passé', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(service.create({ restaurantId: 'r1', date: new Date(Date.now() - 86400000).toISOString(), partySize: 2 } as any, 'user-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('crée la réservation et notifie le propriétaire', async () => {
      prisma.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.reservation.create.mockResolvedValue({
        id: 'res-1',
        date: new Date(Date.now() + 86400000),
        partySize: 2,
        user: { firstName: 'Jean' },
      });

      const result = await service.create({ restaurantId: 'r1', date: new Date(Date.now() + 86400000).toISOString(), partySize: 2 } as any, 'user-1');

      expect(result.id).toBe('res-1');
      expect(notifications.sendToRestaurantOwner).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('rejette si la réservation est introuvable', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);
      await expect(service.cancel('res-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('rejette si l\'utilisateur n\'est pas le propriétaire de la réservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue({ id: 'res-1', userId: 'other-user', status: 'PENDING' });
      await expect(service.cancel('res-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('rejette si la réservation est déjà terminée ou annulée', async () => {
      prisma.reservation.findUnique.mockResolvedValue({ id: 'res-1', userId: 'user-1', status: 'COMPLETED' });
      await expect(service.cancel('res-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('annule la réservation PENDING du propriétaire', async () => {
      prisma.reservation.findUnique.mockResolvedValue({ id: 'res-1', userId: 'user-1', status: 'PENDING' });
      prisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'CANCELLED' });

      const result = await service.cancel('res-1', 'user-1');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('updateStatus', () => {
    it('rejette une transition invalide', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1', status: 'COMPLETED', userId: 'user-1', restaurant: { ownerId: 'owner-1' },
      });
      await expect(service.updateStatus('res-1', { status: 'CONFIRMED' } as any, 'owner-1', 'RESTAURANT'))
        .rejects.toThrow(BadRequestException);
    });

    it('rejette si l\'utilisateur n\'est pas autorisé', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1', status: 'PENDING', userId: 'user-1', restaurant: { ownerId: 'owner-1' },
      });
      await expect(service.updateStatus('res-1', { status: 'CONFIRMED' } as any, 'random-user', 'CLIENT'))
        .rejects.toThrow(ForbiddenException);
    });

    it('attribue des points au client une seule fois lors de la complétion', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1', status: 'CONFIRMED', userId: 'user-1', restaurant: { ownerId: 'owner-1' },
      });
      prisma.reservation.update.mockResolvedValue({ id: 'res-1', status: 'COMPLETED' });

      const result = await service.updateStatus('res-1', { status: 'COMPLETED' } as any, 'owner-1', 'RESTAURANT');

      expect(result.status).toBe('COMPLETED');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('ne distribue pas de points si la réservation est déjà COMPLETED', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        id: 'res-1', status: 'COMPLETED', userId: 'user-1', restaurant: { ownerId: 'owner-1' },
      });
      // COMPLETED → COMPLETED n'est pas une transition autorisée (état terminal)
      await expect(service.updateStatus('res-1', { status: 'COMPLETED' } as any, 'owner-1', 'RESTAURANT'))
        .rejects.toThrow(BadRequestException);
    });
  });
});

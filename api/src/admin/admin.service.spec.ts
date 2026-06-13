import { AdminService } from './admin.service';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('bcrypt');

describe('AdminService', () => {
  let prisma: any;
  let config: any;
  let service: AdminService;

  beforeEach(() => {
    prisma = {
      user: { count: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), groupBy: jest.fn() },
      restaurant: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      reservation: { count: jest.fn() },
      order: { count: jest.fn(), findMany: jest.fn() },
      address: { create: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    config = { get: jest.fn().mockReturnValue('protected@elengi.com') };
    service = new AdminService(prisma, config);
  });

  describe('changeUserRole', () => {
    it('rejette si l\'acteur tente de modifier son propre rôle', async () => {
      await expect(service.changeUserRole('u1', 'ADMIN', 'u1', { role: 'ADMIN' } as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('rejette si l\'utilisateur cible est introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.changeUserRole('admin-1', 'ADMIN', 'u2', { role: 'RESTAURANT' } as any))
        .rejects.toThrow(NotFoundException);
    });

    it('rejette si le compte cible est protégé', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'protected@elengi.com', role: 'CLIENT' });
      await expect(service.changeUserRole('admin-1', 'SUPER_ADMIN', 'u2', { role: 'RESTAURANT' } as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('rejette si un ADMIN tente d\'attribuer le rôle ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'user@test.com', role: 'CLIENT' });
      await expect(service.changeUserRole('admin-1', 'ADMIN', 'u2', { role: 'ADMIN' } as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('rejette si l\'acteur tente de modifier un utilisateur de rang égal ou supérieur', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'admin2@test.com', role: 'ADMIN' });
      await expect(service.changeUserRole('admin-1', 'ADMIN', 'u2', { role: 'RESTAURANT' } as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('permet à un SUPER_ADMIN de promouvoir un CLIENT en ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'user@test.com', role: 'CLIENT' });
      prisma.user.update.mockResolvedValue({ id: 'u2', email: 'user@test.com', role: 'ADMIN' });

      const result = await service.changeUserRole('super-1', 'SUPER_ADMIN', 'u2', { role: 'ADMIN' } as any);

      expect(result.role).toBe('ADMIN');
    });
  });

  describe('toggleUserStatus', () => {
    it('rejette si l\'acteur tente de désactiver son propre compte', async () => {
      await expect(service.toggleUserStatus('u1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('rejette si l\'utilisateur cible est introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.toggleUserStatus('admin-1', 'u2')).rejects.toThrow(NotFoundException);
    });

    it('rejette si le compte cible est protégé', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'protected@elengi.com', role: 'CLIENT', isActive: true });
      await expect(service.toggleUserStatus('admin-1', 'u2')).rejects.toThrow(ForbiddenException);
    });

    it('rejette si la cible est un SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'super@test.com', role: 'SUPER_ADMIN', isActive: true });
      await expect(service.toggleUserStatus('admin-1', 'u2')).rejects.toThrow(ForbiddenException);
    });

    it('bascule isActive pour un utilisateur normal', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', email: 'user@test.com', role: 'CLIENT', isActive: true });
      prisma.user.update.mockResolvedValue({ id: 'u2', email: 'user@test.com', isActive: false });

      const result = await service.toggleUserStatus('admin-1', 'u2');

      expect(result.isActive).toBe(false);
    });
  });

  describe('createRestaurantAccount', () => {
    it('rejette si l\'email est déjà utilisé', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.createRestaurantAccount({
        email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', phone: '+243900000000', restaurantName: 'Resto',
      } as any)).rejects.toThrow(ConflictException);
    });

    it('crée le compte utilisateur et le restaurant en transaction', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.address.create.mockResolvedValue({ id: 'addr-1' });

      prisma.$transaction.mockImplementation(async (cb: any) => cb({
        user: { create: jest.fn().mockResolvedValue({ id: 'u-new', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'RESTAURANT' }) },
        restaurant: { create: jest.fn().mockResolvedValue({ id: 'r-new', name: 'Resto', subscription: 'MAMAN', address: 'Adresse' }) },
      }));

      const result = await service.createRestaurantAccount({
        email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', phone: '+243900000000', restaurantName: 'Resto',
      } as any);

      expect(result.user.email).toBe('a@b.com');
      expect(result.restaurant.id).toBe('r-new');
    });
  });

  describe('getStats', () => {
    it('agrège les statistiques globales', async () => {
      prisma.user.count.mockResolvedValue(10);
      prisma.restaurant.count.mockImplementation((args?: any) => Promise.resolve(args?.where ? 3 : 5));
      prisma.reservation.count.mockResolvedValue(7);
      prisma.order.count.mockResolvedValue(4);
      prisma.user.groupBy.mockResolvedValue([{ role: 'CLIENT', _count: { role: 8 } }]);
      prisma.restaurant.groupBy.mockResolvedValue([{ subscription: 'MAMAN', _count: { subscription: 5 } }]);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.totals.users).toBe(10);
      expect(result.totals.reservations).toBe(7);
      expect(result.usersByRole).toEqual([{ role: 'CLIENT', count: 8 }]);
      expect(result.restaurantsByTier).toEqual([{ tier: 'MAMAN', count: 5 }]);
    });
  });
});

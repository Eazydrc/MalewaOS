import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

jest.mock('bcrypt');

describe('AuthService', () => {
  let prisma: any;
  let jwt: any;
  let config: any;
  let redis: any;
  let mail: any;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      refreshToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed-token'), verify: jest.fn() };
    config = { get: jest.fn() };
    redis = { get: jest.fn(), set: jest.fn(), del: jest.fn(), ttl: jest.fn() };
    mail = { sendOtp: jest.fn() };
    service = new AuthService(prisma, jwt, config, redis, mail);
  });

  describe('register', () => {
    it('rejette si email déjà utilisé', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.register({
        email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', phone: '+243900000000',
      } as any)).rejects.toThrow(ConflictException);
    });

    it('crée un compte inactif et envoie un OTP', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue({ id: 'new-user', email: 'a@b.com', firstName: 'A' });

      const result = await service.register({
        email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B', phone: '+243900000000',
      } as any);

      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: 'CLIENT', isActive: false, emailVerified: false }),
      }));
      expect(mail.sendOtp).toHaveBeenCalledWith('a@b.com', 'A', expect.any(String));
      expect(result.email).toBe('a@b.com');
    });
  });

  describe('login', () => {
    it('rejette si utilisateur introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@y.com', password: 'pass' } as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('rejette si email non vérifié', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', role: 'CLIENT', password: 'hashed', isActive: true, emailVerified: false,
      });
      await expect(service.login({ email: 'a@b.com', password: 'pass' } as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('rejette si mot de passe incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', role: 'CLIENT', password: 'hashed', isActive: true, emailVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'a@b.com', password: 'wrong' } as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('retourne des tokens directement pour un CLIENT', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com', role: 'CLIENT', firstName: 'A', password: 'hashed', isActive: true, emailVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'a@b.com', password: 'pass' } as any) as any;

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
      expect(result.mfaRequired).toBeUndefined();
    });

    it('exige le MFA pour un ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'admin@elengi.com', role: 'ADMIN', firstName: 'Admin', password: 'hashed', isActive: true, emailVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'admin@elengi.com', password: 'pass' } as any) as any;

      expect(result.mfaRequired).toBe(true);
      expect(result.mfaToken).toBeDefined();
      expect(mail.sendOtp).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('mfa:'),
        expect.any(String),
        expect.any(Number),
      );
    });
  });

  describe('refreshFromToken', () => {
    it('rejette un refresh token invalide', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
      await expect(service.refreshFromToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejette un refresh token révoqué ou inconnu', async () => {
      jwt.verify.mockReturnValue({ sub: 'u1', email: 'a@b.com', role: 'CLIENT' });
      prisma.refreshToken.findFirst.mockResolvedValue(null);
      await expect(service.refreshFromToken('token')).rejects.toThrow(UnauthorizedException);
    });

    it('révoque l\'ancien token et émet de nouveaux tokens', async () => {
      jwt.verify.mockReturnValue({ sub: 'u1', email: 'a@b.com', role: 'CLIENT' });
      prisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt1', expiresAt: new Date(Date.now() + 10000),
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshFromToken('token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({ where: { id: 'rt1' }, data: { revoked: true } });
      expect(result.accessToken).toBe('signed-token');
    });
  });

  describe('changePassword', () => {
    it('rejette pour un compte Google sans mot de passe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: null });
      await expect(service.changePassword('u1', 'old', 'new')).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si le mot de passe actuel est incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.changePassword('u1', 'wrong', 'new')).rejects.toThrow(UnauthorizedException);
    });

    it('met à jour le mot de passe si valide', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');
      prisma.user.update.mockResolvedValue({});

      const result = await service.changePassword('u1', 'old', 'new');

      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { password: 'new-hashed' } });
      expect(result.message).toBeDefined();
    });
  });
});

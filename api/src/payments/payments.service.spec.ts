import { PaymentsService } from './payments.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let prisma: any;
  let config: any;
  let service: PaymentsService;

  beforeEach(() => {
    prisma = {
      restaurant: { findFirst: jest.fn(), update: jest.fn() },
      paymentTransaction: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
      orderPaymentTransaction: { create: jest.fn(), findUnique: jest.fn().mockResolvedValue(null), update: jest.fn(), updateMany: jest.fn() },
      order: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      user: { update: jest.fn() },
      pointTransaction: { create: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    config = { get: jest.fn() };
    service = new PaymentsService(prisma, config);
  });

  describe('initiatePayment', () => {
    it('rejette un tier invalide', async () => {
      await expect(service.initiatePayment('user-1', 'INVALID' as any, '+243900000000'))
        .rejects.toThrow(BadRequestException);
    });

    it('rejette si le restaurant est introuvable', async () => {
      prisma.restaurant.findFirst.mockResolvedValue(null);
      await expect(service.initiatePayment('user-1', 'ESSENTIEL', '+243900000000'))
        .rejects.toThrow(BadRequestException);
    });

    it('simule un paiement réussi en dev sans clé CinetPay', async () => {
      prisma.restaurant.findFirst.mockResolvedValue({ id: 'resto-1' });
      prisma.paymentTransaction.create.mockResolvedValue({});
      prisma.paymentTransaction.findUnique.mockResolvedValue({
        transactionId: 'TX-1', status: 'PENDING', restaurantId: 'resto-1', tier: 'ESSENTIEL', amountUsd: 1000,
      });

      const result = await service.initiatePayment('user-1', 'ESSENTIEL', '+243900000000');

      expect(result.devMode).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('ignore un webhook sans transaction_id', async () => {
      const result = await service.handleWebhook({} as any);
      expect(result).toEqual({ message: 'ignored' });
      expect(prisma.paymentTransaction.findUnique).not.toHaveBeenCalled();
    });

    it('ignore un webhook pour une transaction inconnue', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue(null);
      const result = await service.handleWebhook({ cpm_trans_id: 'TX-404' } as any);
      expect(result).toEqual({ message: 'ignored' });
    });

    it('ignore le webhook si CinetPay non configuré', async () => {
      prisma.paymentTransaction.findUnique.mockResolvedValue({ transactionId: 'TX-1', amountUsd: 1000 });
      const result = await service.handleWebhook({ cpm_trans_id: 'TX-1' } as any);
      expect(result).toEqual({ message: 'ignored' });
    });

    it('marque la transaction FAILED si le montant vérifié ne correspond pas', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'CINETPAY_API_KEY') return 'real-api-key';
        if (key === 'CINETPAY_SITE_ID') return 'site-1';
        return undefined;
      });
      service = new PaymentsService(prisma, config);

      prisma.paymentTransaction.findUnique.mockResolvedValue({
        transactionId: 'TX-1', amountUsd: 1000, status: 'PENDING', restaurantId: 'resto-1', tier: 'ESSENTIEL',
      });

      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          code: '00',
          data: { status: 'ACCEPTED', amount: 9999999, currency: 'CDF' },
        }),
      }) as any;

      const result = await service.handleWebhook({ cpm_trans_id: 'TX-1' } as any);

      expect(result).toEqual({ message: 'OK' });
      expect(prisma.paymentTransaction.updateMany).toHaveBeenCalledWith({
        where: { transactionId: 'TX-1' },
        data: { status: 'FAILED' },
      });
    });

    it('valide le paiement et upgrade le restaurant si tout correspond', async () => {
      config.get.mockImplementation((key: string) => {
        if (key === 'CINETPAY_API_KEY') return 'real-api-key';
        if (key === 'CINETPAY_SITE_ID') return 'site-1';
        return undefined;
      });
      service = new PaymentsService(prisma, config);

      const tx = { transactionId: 'TX-1', amountUsd: 1000, status: 'PENDING', restaurantId: 'resto-1', tier: 'ESSENTIEL' };
      prisma.paymentTransaction.findUnique.mockResolvedValue(tx);

      const expectedCdf = Math.round((tx.amountUsd / 100) * 2800);

      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({
          code: '00',
          data: { status: 'ACCEPTED', amount: expectedCdf, currency: 'CDF' },
        }),
      }) as any;

      const result = await service.handleWebhook({ cpm_trans_id: 'TX-1' } as any);

      expect(result).toEqual({ message: 'OK' });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('retourne une liste vide si aucun restaurant', async () => {
      prisma.restaurant.findFirst.mockResolvedValue(null);
      const result = await service.getHistory('user-1');
      expect(result).toEqual([]);
    });

    it('retourne l\'historique du restaurant', async () => {
      prisma.restaurant.findFirst.mockResolvedValue({ id: 'resto-1' });
      prisma.paymentTransaction.findMany.mockResolvedValue([{ transactionId: 'TX-1' }]);
      const result = await service.getHistory('user-1');
      expect(result).toEqual([{ transactionId: 'TX-1' }]);
    });
  });
});

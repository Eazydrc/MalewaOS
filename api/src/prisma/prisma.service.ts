import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected');
    } catch (err) {
      // Non-fatal : l'app démarre et le healthcheck passe même si la DB est momentanément indisponible
      this.logger.error(`Database connection failed (non-fatal): ${err?.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

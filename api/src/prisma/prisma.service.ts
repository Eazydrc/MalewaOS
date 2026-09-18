import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  if (process.env.NODE_ENV === 'production' && !url.includes('sslmode')) {
    return url.includes('?') ? `${url}&sslmode=require` : `${url}?sslmode=require`;
  }
  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = buildDatasourceUrl();
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit() {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB connection timeout after 8s')), 8000),
    );
    try {
      await Promise.race([this.$connect(), timeout]);
      this.logger.log('Database connected');
    } catch (err) {
      this.logger.error(`Database connection failed (non-fatal): ${err?.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

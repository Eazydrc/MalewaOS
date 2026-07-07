import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('REDIS_HOST', 'localhost');
    const port = this.config.get<number>('REDIS_PORT', 6379);
    process.stdout.write(`[REDIS] Connecting to ${host}:${port}\n`);
    this.client = new Redis({
      host,
      port,
      password: this.config.get<string>('REDIS_PASSWORD'),
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,  // pas de retry — fail immédiat si Redis absent
    });
    try {
      await this.client.connect();
      process.stderr.write('[REDIS] Connected\n');
    } catch (err) {
      process.stderr.write(`[REDIS] Connection failed (non-fatal): ${err?.message}\n`);
      // Ne pas throw — l'app démarre même si Redis est indisponible
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}

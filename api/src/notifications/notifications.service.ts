import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService, private config: ConfigService) {
    webpush.setVapidDetails(
      config.get('VAPID_SUBJECT') ?? 'mailto:noreply@elengi.cd',
      config.get('VAPID_PUBLIC_KEY') ?? '',
      config.get('VAPID_PRIVATE_KEY') ?? '',
    );
  }

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string) {
    await this.prisma.pushSubscription.upsert({
      where:  { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId, p256dh, auth },
    });
    return { message: 'Abonné aux notifications' };
  }

  async unsubscribe(userId: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId } });
    return { message: 'Désabonné' };
  }

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; icon?: string; url?: string },
  ) {
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    const json = JSON.stringify(payload);
    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            json,
          );
        } catch (err: any) {
          this.logger.warn(`Push failed for ${sub.endpoint}: ${err.message}`);
          if (err.statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
          }
        }
      }),
    );
  }

  async sendToRestaurantOwner(
    restaurantId: string,
    payload: { title: string; body: string; url?: string },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });
    if (restaurant) await this.sendToUser(restaurant.ownerId, payload);
  }

  getVapidPublicKey() {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') ?? '' };
  }
}

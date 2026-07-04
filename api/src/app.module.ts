import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ReservationsModule } from './reservations/reservations.module';
import { WalletModule } from './wallet/wallet.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { MenuModule } from './menu/menu.module';
import { OffersModule } from './offers/offers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TablesModule } from './tables/tables.module';
import { StatsModule } from './stats/stats.module';
import { StaffModule } from './staff/staff.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { HomeModule } from './home/home.module';
import { UploadModule } from './upload/upload.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name:  'default',
        ttl:   60_000,
        limit: process.env.NODE_ENV === 'production' ? 60 : 10_000,
      },
    ]),
    PrismaModule,
    RedisModule,
    MailModule,
    AuthModule,
    RestaurantsModule,
    ReservationsModule,
    WalletModule,
    OrdersModule,
    AdminModule,
    MenuModule,
    OffersModule,
    ReviewsModule,
    TablesModule,
    StatsModule,
    StaffModule,
    NotificationsModule,
    PaymentsModule,
    HomeModule,
    UploadModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

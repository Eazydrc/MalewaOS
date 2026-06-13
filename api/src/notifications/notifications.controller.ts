import { Controller, Post, Delete, Get, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get('vapid-public-key')
  @SkipThrottle()
  getKey() {
    return this.svc.getVapidPublicKey();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@CurrentUser() user: JwtUser, @Body() dto: SubscribeDto) {
    return this.svc.subscribe(user.id, dto.endpoint, dto.keys.p256dh, dto.keys.auth);
  }

  @Delete('unsubscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribe(@CurrentUser() user: JwtUser) {
    return this.svc.unsubscribe(user.id);
  }
}

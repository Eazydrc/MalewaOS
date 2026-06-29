import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, InitiateOrderPaymentDto, CinetPayWebhookDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  initiate(@CurrentUser() user: JwtUser, @Body() dto: InitiatePaymentDto) {
    return this.svc.initiatePayment(user.id, dto.tier, dto.phone, dto.method);
  }

  @Get('orders/due')
  @UseGuards(JwtAuthGuard)
  ordersDue(@CurrentUser() user: JwtUser, @Query('restaurantId') restaurantId: string, @Query('orderId') orderId?: string) {
    return this.svc.getOrdersDue(user.id, restaurantId, orderId);
  }

  @Post('orders/initiate')
  @UseGuards(JwtAuthGuard)
  initiateOrderPayment(@CurrentUser() user: JwtUser, @Body() dto: InitiateOrderPaymentDto) {
    return this.svc.initiateOrderPayment(user.id, dto.restaurantId, dto.phone, dto.method, dto.orderId);
  }

  @Post('orders/:id/mark-paid-cash')
  @UseGuards(JwtAuthGuard)
  markPaidCash(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.svc.markOrderPaidCash(id, user.id, user.role);
  }

  @Post('webhook')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  webhook(@Body() dto: CinetPayWebhookDto) {
    return this.svc.handleWebhook(dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  history(@CurrentUser() user: JwtUser) {
    return this.svc.getHistory(user.id);
  }
}

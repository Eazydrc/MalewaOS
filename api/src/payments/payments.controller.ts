import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, CinetPayWebhookDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  initiate(@CurrentUser() user: JwtUser, @Body() dto: InitiatePaymentDto) {
    return this.svc.initiatePayment(user.id, dto.tier, dto.phone);
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

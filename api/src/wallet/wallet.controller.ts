import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { RedeemPointsDto, AwardPointsDto, WalletHistoryQueryDto } from './dto/wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get()
  getSummary(@CurrentUser() user: JwtUser) {
    return this.wallet.getSummary(user.id);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: JwtUser,
    @Query() query: WalletHistoryQueryDto,
  ) {
    return this.wallet.getHistory(user.id, query.page ?? 1, query.limit ?? 20);
  }

  @Post('redeem')
  redeem(@Body() dto: RedeemPointsDto, @CurrentUser() user: JwtUser) {
    return this.wallet.redeem(user.id, dto.points);
  }

  @Post('award/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  award(@Param('userId') targetId: string, @Body() dto: AwardPointsDto) {
    return this.wallet.awardPoints(targetId, dto.points, dto.reason);
  }
}

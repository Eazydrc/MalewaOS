import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMyStats(@CurrentUser() user: JwtUser) {
    return this.stats.getMyStats(user.id);
  }

  @Get('mine/advanced')
  @UseGuards(JwtAuthGuard)
  getAdvanced(@CurrentUser() user: JwtUser) {
    return this.stats.getAdvancedStats(user.id);
  }
}

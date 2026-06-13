import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('offers')
export class OffersController {
  constructor(private offers: OffersService) {}

  // Public — offres actives d'un restaurant
  @Get('public/:restaurantId')
  findPublic(@Param('restaurantId') id: string) {
    return this.offers.findPublic(id);
  }

  // Owner — mes offres
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: JwtUser) {
    return this.offers.findMine(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOfferDto, @CurrentUser() user: JwtUser) {
    return this.offers.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateOfferDto, @CurrentUser() user: JwtUser) {
    return this.offers.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.offers.remove(id, user.id);
  }
}

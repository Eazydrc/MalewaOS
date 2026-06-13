import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto, UpdateRestaurantDto, QueryRestaurantDto } from './dto/restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurants: RestaurantsService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: JwtUser) {
    return this.restaurants.findMine(user.id);
  }

  /** Public — tous les restaurants géolocalisés pour la map */
  @Get('map')
  findMap() {
    return this.restaurants.findForMap();
  }

  @Get()
  findAll(@Query() query: QueryRestaurantDto) {
    return this.restaurants.findAll(query);
  }

  /** Public — profil complet d'un restaurant (vue client) */
  @Get(':id/public')
  findPublic(@Param('id') id: string) {
    return this.restaurants.findPublic(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurants.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT', 'ADMIN')
  create(@Body() dto: CreateRestaurantDto, @CurrentUser() user: JwtUser) {
    return this.restaurants.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto, @CurrentUser() user: JwtUser) {
    return this.restaurants.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.restaurants.remove(id, user.id, user.role);
  }
}

import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationDto, UpdateStatusDto } from './dto/reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private reservations: ReservationsService) {}

  @Get()
  findMine(@CurrentUser() user: JwtUser) {
    return this.reservations.findByUser(user.id);
  }

  @Get('restaurant/:restaurantId')
  findByRestaurant(@Param('restaurantId') rid: string, @CurrentUser() user: JwtUser) {
    return this.reservations.findByRestaurant(rid, user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.reservations.findOne(id, user.id, user.role);
  }

  @Post()
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: JwtUser) {
    return this.reservations.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto, @CurrentUser() user: JwtUser) {
    return this.reservations.update(id, dto, user.id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.reservations.cancel(id, user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: JwtUser) {
    return this.reservations.updateStatus(id, dto, user.id, user.role);
  }
}

import { Controller, Get, Post, Patch, Put, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDriverDto, UpdateDriverLocationDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: JwtUser) {
    return this.orders.create(dto, user.id);
  }

  @Get('mine')
  findMine(@CurrentUser() user: JwtUser) {
    return this.orders.findByUser(user.id);
  }

  // ── Livreur ────────────────────────────────────────────────────────────────

  @Get('driver/mine')
  findDriverOrders(@CurrentUser() user: JwtUser) {
    return this.orders.findDriverOrders(user.id);
  }

  @Get('drivers/available')
  findAvailableDrivers() {
    return this.orders.findAvailableDrivers();
  }

  // ── Tracking ───────────────────────────────────────────────────────────────

  @Get(':id/tracking')
  getTracking(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.orders.getTracking(id, user.id);
  }

  // ── Assign driver (restaurant) ─────────────────────────────────────────────

  @Patch(':id/assign-driver')
  assignDriver(@Param('id') id: string, @Body() dto: AssignDriverDto, @CurrentUser() user: JwtUser) {
    return this.orders.assignDriver(id, dto, user.id, user.role);
  }

  // ── Livreur actions ────────────────────────────────────────────────────────

  @Patch(':id/driver/pickup')
  driverPickup(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.orders.driverPickup(id, user.id);
  }

  @Patch(':id/driver/deliver')
  driverDeliver(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.orders.driverDeliver(id, user.id);
  }

  @Put(':id/driver/location')
  updateDriverLocation(
    @Param('id') id: string,
    @Body() dto: UpdateDriverLocationDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.orders.updateDriverLocation(id, user.id, dto);
  }

  // ── Génériques ─────────────────────────────────────────────────────────────

  @Get('restaurant/:restaurantId')
  findByRestaurant(@Param('restaurantId') rid: string, @CurrentUser() user: JwtUser) {
    return this.orders.findByRestaurant(rid, user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.orders.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser() user: JwtUser) {
    return this.orders.updateStatus(id, dto, user.id, user.role);
  }
}

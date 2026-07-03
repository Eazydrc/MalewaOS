import { Controller, Get, Post, Patch, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, AssignDriverDto, UpdateDriverLocationDto, RefuseOrderDto, SetDriverAvailabilityDto, ConfirmDeliveryDto } from './dto/order.dto';
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

  @Get('driver/requests')
  getDeliveryRequests(@CurrentUser() user: JwtUser) {
    return this.orders.getDeliveryRequests(user.id);
  }

  @Get('driver/stats')
  getDriverStats(@CurrentUser() user: JwtUser) {
    return this.orders.getDriverStats(user.id);
  }

  @Post('driver/affiliations/join')
  joinAffiliation(@Body() dto: { code: string }, @CurrentUser() user: JwtUser) {
    return this.orders.joinAffiliation(user.id, dto.code);
  }

  @Get('driver/affiliations')
  getDriverAffiliations(@CurrentUser() user: JwtUser) {
    return this.orders.getDriverAffiliations(user.id);
  }

  @Delete('driver/affiliations/:restaurantId')
  leaveAffiliation(@Param('restaurantId') rid: string, @CurrentUser() user: JwtUser) {
    return this.orders.leaveAffiliation(user.id, rid);
  }

  @Post(':id/claim')
  claimDelivery(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.orders.claimDelivery(id, user.id);
  }

  @Get('drivers/available')
  findAvailableDrivers() {
    return this.orders.findAvailableDrivers();
  }

  @Patch('drivers/availability')
  setDriverAvailability(@Body() dto: SetDriverAvailabilityDto, @CurrentUser() user: JwtUser) {
    return this.orders.setDriverAvailability(user.id, dto.isAvailable, dto.lat, dto.lng);
  }

  // ── Restaurant : affiliation livreur ──────────────────────────────────────

  @Get('restaurant/:restaurantId/affiliation-code')
  getAffiliationCode(@Param('restaurantId') rid: string, @CurrentUser() user: JwtUser) {
    return this.orders.getOrCreateAffiliationCode(rid, user.id, user.role);
  }

  @Get('restaurant/:restaurantId/affiliated-drivers')
  getAffiliatedDrivers(@Param('restaurantId') rid: string, @CurrentUser() user: JwtUser) {
    return this.orders.getRestaurantAffiliatedDrivers(rid, user.id, user.role);
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

  @Post(':id/find-driver')
  findDriver(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.orders.findDriver(id, user.id, user.role);
  }

  @Post(':id/accept-delivery')
  acceptDeliveryRequest(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.orders.acceptDeliveryRequest(id, user.id);
  }

  // ── Livreur actions ────────────────────────────────────────────────────────

  @Post(':id/confirm-delivery')
  confirmDelivery(@Param('id') id: string, @Body() dto: ConfirmDeliveryDto, @CurrentUser() user: JwtUser) {
    return this.orders.confirmDelivery(id, user.id, dto.code);
  }

  @Post(':id/driver/scan-pickup')
  driverScanPickup(@Param('id') id: string, @Body() dto: ConfirmDeliveryDto, @CurrentUser() user: JwtUser) {
    return this.orders.driverScanPickup(id, user.id, dto.code);
  }

  @Post(':id/report-problem')
  reportProblem(@Param('id') id: string, @Body() dto: { reason: string }, @CurrentUser() user: JwtUser) {
    return this.orders.reportProblem(id, user.id, dto.reason);
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

  @Patch(':id/refuse')
  refuse(@Param('id') id: string, @Body() dto: RefuseOrderDto, @CurrentUser() user: JwtUser) {
    return this.orders.refuse(id, dto.reason, user.id, user.role);
  }
}

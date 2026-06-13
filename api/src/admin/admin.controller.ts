import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ChangeRoleDto,
  ChangeSubscriptionDto,
  UserFiltersDto,
  RestaurantFiltersDto,
  OrderFiltersDto,
  CreateRestaurantAccountDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── STATS ──────────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ─── UTILISATEURS ───────────────────────────────────────────────────────────

  @Get('users')
  getUsers(@Query() filters: UserFiltersDto) {
    return this.adminService.getUsers(filters);
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  changeUserRole(
    @CurrentUser() actor: any,
    @Param('id') targetId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.adminService.changeUserRole(actor.id, actor.role, targetId, dto);
  }

  @Patch('users/:id/status')
  toggleUserStatus(
    @CurrentUser() actor: any,
    @Param('id') targetId: string,
  ) {
    return this.adminService.toggleUserStatus(actor.id, targetId);
  }

  // ─── RESTAURANTS ────────────────────────────────────────────────────────────

  @Post('restaurants/create-account')
  createRestaurantAccount(@Body() dto: CreateRestaurantAccountDto) {
    return this.adminService.createRestaurantAccount(dto);
  }

  @Get('restaurants')
  getRestaurants(@Query() filters: RestaurantFiltersDto) {
    return this.adminService.getRestaurants(filters);
  }

  @Patch('restaurants/:id/status')
  toggleRestaurantStatus(@Param('id') id: string) {
    return this.adminService.toggleRestaurantStatus(id);
  }

  @Patch('restaurants/:id/subscription')
  changeRestaurantSubscription(
    @Param('id') id: string,
    @Body() dto: ChangeSubscriptionDto,
  ) {
    return this.adminService.changeRestaurantSubscription(id, dto);
  }

  // ─── COMMANDES ──────────────────────────────────────────────────────────────

  @Get('orders')
  getOrders(@Query() filters: OrderFiltersDto) {
    return this.adminService.getOrders(filters);
  }

  // ─── ADRESSES ───────────────────────────────────────────────────────────────

  @Get('addresses')
  getAddresses() {
    return this.adminService.getAddresses();
  }
}

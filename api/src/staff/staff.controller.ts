import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto, UpdateStaffDto, CreateStaffLoginDto } from './dto/staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.staff.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateStaffDto) {
    return this.staff.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.staff.remove(id, user.id);
  }

  @Post(':id/login')
  createLogin(@Param('id') id: string, @CurrentUser() user: JwtUser, @Body() dto: CreateStaffLoginDto) {
    return this.staff.createLogin(id, user.id, dto.email, dto.password);
  }

  @Delete(':id/login')
  removeLogin(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.staff.removeLogin(id, user.id);
  }
}

import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('tables')
export class TablesController {
  constructor(private readonly tables: TablesService) {}

  /** Public — landing QR (no auth) */
  @Get('public/:tableId')
  getPublicTable(@Param('tableId') tableId: string) {
    return this.tables.getPublicTable(tableId);
  }

  /** Owner — list tables */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: JwtUser) {
    return this.tables.findMine(user.id);
  }

  /** Owner — create table */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTableDto) {
    return this.tables.create(user.id, dto);
  }

  /** Owner — delete table */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.tables.remove(id, user.id);
  }
}

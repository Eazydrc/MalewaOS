import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { MenuService } from './menu.service';
import {
  CreateSectionDto, UpdateSectionDto,
  CreateItemDto, UpdateItemDto,
} from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

class ToggleDailySpecialDto {
  @IsBoolean()
  isDailySpecial: boolean;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

@Controller('menu')
export class MenuController {
  constructor(private menu: MenuService) {}

  // ── Menu public (sans auth) ───────────────────────────────────────────────

  @Get('public/:restaurantId')
  getPublicMenu(@Param('restaurantId') restaurantId: string) {
    return this.menu.getPublicMenu(restaurantId);
  }

  // ── Menu principal (auth requis) ──────────────────────────────────────────

  /** Récupère (ou crée) le menu du restaurant connecté */
  @Get()
  @UseGuards(JwtAuthGuard)
  getMenu(@CurrentUser() user: JwtUser) {
    return this.menu.ensureMenu(user.id);
  }

  // ── Sections ──────────────────────────────────────────────────────────────

  @Post('sections')
  @UseGuards(JwtAuthGuard)
  createSection(@Body() dto: CreateSectionDto, @CurrentUser() user: JwtUser) {
    return this.menu.createSection(user.id, dto);
  }

  @Patch('sections/:id')
  @UseGuards(JwtAuthGuard)
  updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.menu.updateSection(id, user.id, dto);
  }

  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard)
  deleteSection(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.menu.deleteSection(id, user.id);
  }

  // ── Items ─────────────────────────────────────────────────────────────────

  @Post('sections/:sectionId/items')
  @UseGuards(JwtAuthGuard)
  createItem(
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateItemDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.menu.createItem(sectionId, user.id, dto);
  }

  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.menu.updateItem(id, user.id, dto);
  }

  @Patch('items/:id/toggle')
  @UseGuards(JwtAuthGuard)
  toggleItem(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.menu.toggleItem(id, user.id);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  deleteItem(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.menu.deleteItem(id, user.id);
  }

  // ── Plat du jour ──────────────────────────────────────────────────────────

  /** Activer/désactiver le plat du jour sur un item */
  @Patch('items/:id/daily')
  @UseGuards(JwtAuthGuard)
  toggleDailySpecial(
    @Param('id') id: string,
    @Body() dto: ToggleDailySpecialDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.menu.toggleDailySpecial(id, user.id, dto.isDailySpecial, dto.endsAt);
  }

  /** Statut quota plat du jour du restaurant connecté */
  @Get('daily-special/status')
  @UseGuards(JwtAuthGuard)
  getDailySpecialStatus(@CurrentUser() user: JwtUser) {
    return this.menu.getDailySpecialStatus(user.id);
  }
}

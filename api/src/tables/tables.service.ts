import {
  Injectable, NotFoundException, ForbiddenException,
  ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/table.dto';

const CROISSANCE_TIERS = ['CROISSANCE', 'DOMINATION'];

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedRestaurant(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Aucun restaurant trouvé pour ce compte');
    if (!CROISSANCE_TIERS.includes(restaurant.subscription))
      throw new ForbiddenException('Tables QR disponibles à partir du pack Croissance');
    return restaurant;
  }

  // ── CRUD owner ────────────────────────────────────────────────────────────

  async findMine(ownerId: string) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    return this.prisma.restaurantTable.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      orderBy: { number: 'asc' },
    });
  }

  async create(ownerId: string, dto: CreateTableDto) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    const existing = await this.prisma.restaurantTable.findUnique({
      where: { restaurantId_number: { restaurantId: restaurant.id, number: dto.number } },
    });
    if (existing) throw new ConflictException(`La table n°${dto.number} existe déjà`);
    return this.prisma.restaurantTable.create({
      data: { restaurantId: restaurant.id, number: dto.number, label: dto.label },
    });
  }

  async remove(tableId: string, ownerId: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { id: tableId },
      include: { restaurant: true },
    });
    if (!table) throw new NotFoundException('Table introuvable');
    if (table.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    await this.prisma.restaurantTable.delete({ where: { id: tableId } });
    return { message: 'Table supprimée' };
  }

  // ── Public — landing page QR ──────────────────────────────────────────────

  async getPublicTable(tableId: string) {
    const table = await this.prisma.restaurantTable.findUnique({
      where: { id: tableId, isActive: true },
      include: {
        restaurant: {
          select: {
            id: true, name: true, description: true, imageUrl: true,
            address: true, city: true, isOpen: true, subscription: true,
            categories: true, priceRange: true,
          },
        },
      },
    });
    if (!table) throw new NotFoundException('Table introuvable ou inactive');

    // Menu du restaurant
    const menu = await this.prisma.menu.findFirst({
      where: { restaurantId: table.restaurantId, isActive: true },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            items: { where: { isAvailable: true }, orderBy: { order: 'asc' } },
          },
        },
      },
    });

    return { table: { id: table.id, number: table.number, label: table.label }, restaurant: table.restaurant, menu };
  }
}

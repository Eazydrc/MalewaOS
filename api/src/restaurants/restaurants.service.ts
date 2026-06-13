import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto, UpdateRestaurantDto, QueryRestaurantDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findMine(ownerId: string) {
    return this.prisma.restaurant.findFirst({
      where: { ownerId, isActive: true },
      include: {
        menus: {
          where: { isActive: true },
          include: {
            sections: {
              include: { items: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  /** Tous les restaurants géolocalisés pour la map */
  async findForMap() {
    return this.prisma.restaurant.findMany({
      where: { isActive: true, lat: { not: null }, lng: { not: null } },
      select: {
        id: true, name: true, lat: true, lng: true,
        cuisine: true, restaurantType: true, isOpen: true,
        rating: true, imageUrl: true, subscription: true,
      },
    });
  }

  /** Profil public complet — vue client */
  async findPublic(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id, isActive: true },
      include: {
        structuredAddress: true,
        menus: {
          where: { isActive: true },
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                items: {
                  where: { isAvailable: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        offers: {
          where: {
            isActive: true,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          where: { isPublished: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    // Exclure les champs sensibles et normaliser l'adresse
    const { ownerId, structuredAddress, address: addressRaw, ...safe } = restaurant;

    // Construire un objet adresse unifié pour le frontend
    const address = {
      commune:   structuredAddress?.commune   ?? null,
      quartier:  structuredAddress?.quartier  ?? null,
      numero:    structuredAddress?.numero    ?? null,
      reference: structuredAddress?.reference ?? null,
      full:      addressRaw ?? null,  // adresse textuelle complète (fallback)
    };

    return { ...safe, address };
  }

  async findAll(query: QueryRestaurantDto) {
    const { search, category, city, page = 1, limit = 12, isOpen, minRating, maxPriceRange, cuisine, restaurantType } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RestaurantWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address:     { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category)             where.categories   = { has: category };
    if (city)                 where.city         = { equals: city, mode: 'insensitive' };
    if (isOpen !== undefined) where.isOpen       = isOpen;
    if (minRating)            where.rating       = { gte: minRating };
    if (maxPriceRange)        where.priceRange   = { lte: maxPriceRange };
    if (cuisine)              where.cuisine      = cuisine;
    if (restaurantType)       where.restaurantType = restaurantType;

    const [items, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, name: true, description: true, address: true, city: true,
          imageUrl: true, categories: true, priceRange: true, rating: true,
          reviewCount: true, isOpen: true,
        },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id, isActive: true },
      include: {
        menus: {
          where: { isActive: true },
          include: {
            sections: {
              include: { items: { where: { isAvailable: true } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurant introuvable');
    return restaurant;
  }

  async create(dto: CreateRestaurantDto, ownerId: string) {
    return this.prisma.restaurant.create({
      data: { ...dto, ownerId },
    });
  }

  async update(id: string, dto: UpdateRestaurantDto, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role) && restaurant.ownerId !== userId) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.restaurant.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role) && restaurant.ownerId !== userId) {
      throw new ForbiddenException('Non autorisé');
    }

    return this.prisma.restaurant.update({ where: { id }, data: { isActive: false } });
  }
}

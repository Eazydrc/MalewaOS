import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChangeRoleDto,
  ChangeSubscriptionDto,
  UserFiltersDto,
  RestaurantFiltersDto,
  OrderFiltersDto,
  CreateRestaurantAccountDto,
} from './dto/admin.dto';

// Hiérarchie des rôles : SUPER_ADMIN > ADMIN > RESTAURANT > CLIENT
const ROLE_RANK: Record<string, number> = {
  CLIENT: 0,
  RESTAURANT: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

@Injectable()
export class AdminService {
  private readonly protectedEmail: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.protectedEmail = this.config.get<string>('PROTECTED_SUPER_ADMIN_EMAIL') ?? '';
    if (!this.protectedEmail) {
      console.warn('[AdminService] PROTECTED_SUPER_ADMIN_EMAIL non défini — aucun compte ne sera protégé');
    }
  }

  private assertNotProtected(email: string) {
    if (this.protectedEmail && email === this.protectedEmail) {
      throw new ForbiddenException('Ce compte est protégé et ne peut pas être modifié');
    }
  }

  // ─── STATS GLOBALES ─────────────────────────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      totalRestaurants,
      totalReservations,
      totalOrders,
      activeRestaurants,
      usersByRole,
      restaurantsByTier,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.restaurant.count(),
      this.prisma.reservation.count(),
      this.prisma.order.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      this.prisma.restaurant.groupBy({
        by: ['subscription'],
        _count: { subscription: true },
      }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totals: {
        users: totalUsers,
        restaurants: totalRestaurants,
        reservations: totalReservations,
        orders: totalOrders,
        activeRestaurants,
      },
      usersByRole: usersByRole.map(r => ({
        role: r.role,
        count: r._count.role,
      })),
      restaurantsByTier: restaurantsByTier.map(r => ({
        tier: r.subscription,
        count: r._count.subscription,
      })),
      recentUsers,
    };
  }

  // ─── GESTION UTILISATEURS ────────────────────────────────────────────────────

  async getUsers(filters: UserFiltersDto) {
    const { search, role, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          points: true,
          createdAt: true,
          avatarUrl: true,
          _count: {
            select: { reservations: true, orders: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        points: true,
        createdAt: true,
        updatedAt: true,
        avatarUrl: true,
        address: true,
        _count: {
          select: { reservations: true, orders: true, reviews: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async changeUserRole(
    actorId: string,
    actorRole: string,
    targetId: string,
    dto: ChangeRoleDto,
  ) {
    if (actorId === targetId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier votre propre rôle');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException('Utilisateur introuvable');

    // Compte protégé — intouchable
    this.assertNotProtected(target.email);

    const newRoleRank = ROLE_RANK[dto.role] ?? 0;
    const actorRank   = ROLE_RANK[actorRole] ?? 0;

    // Seul SUPER_ADMIN peut attribuer ADMIN ou SUPER_ADMIN
    if (newRoleRank >= ROLE_RANK['ADMIN'] && actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Seul le Super Admin peut attribuer les rôles Admin ou Super Admin',
      );
    }

    // Un admin ne peut pas modifier quelqu'un de rang supérieur ou égal
    if (ROLE_RANK[target.role] >= actorRank) {
      throw new ForbiddenException(
        "Vous ne pouvez pas modifier le rôle d'un utilisateur de rang supérieur ou égal",
      );
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: dto.role as any },
      select: { id: true, email: true, role: true },
    });
  }

  async toggleUserStatus(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new ForbiddenException('Vous ne pouvez pas désactiver votre propre compte');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Compte protégé — intouchable
    this.assertNotProtected(user.email);

    // Un admin ne peut pas toucher un SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Impossible de modifier un compte Super Admin');
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });
  }

  // ─── CRÉER UN COMPTE RESTAURANT ──────────────────────────────────────────────

  async createRestaurantAccount(dto: CreateRestaurantAccountDto) {
    // Vérifier email unique
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hash = await bcrypt.hash(dto.password, 12);

    // Créer l'adresse structurée
    const address = await this.prisma.address.create({
      data: {
        ville:     dto.ville     ?? 'Kinshasa',
        commune:   dto.commune,
        quartier:  dto.quartier,
        numero:    dto.numero,
        reference: dto.reference,
      },
    });

    // Adresse textuelle pour rétrocompatibilité (restaurant.address)
    const addressText = [
      dto.numero ? `N°${dto.numero}` : null,
      dto.quartier,
      dto.commune,
      dto.ville ?? 'Kinshasa',
    ].filter(Boolean).join(', ');

    // Créer le compte utilisateur et le restaurant dans une transaction atomique
    const { user, restaurant } = await this.prisma.$transaction(async (tx) => {
      // emailVerified: true — l'admin crée le compte, pas besoin de vérification
      const createdUser = await tx.user.create({
        data: {
          firstName:     dto.firstName,
          lastName:      dto.lastName,
          email:         dto.email,
          phone:         dto.phone,
          password:      hash,
          role:          'RESTAURANT',
          points:        0,
          emailVerified: true,
          isActive:      true,
        },
      });

      // Créer le restaurant avec adresse structurée liée
      const createdRestaurant = await tx.restaurant.create({
        data: {
          ownerId:        createdUser.id,
          name:           dto.restaurantName,
          address:        addressText,
          city:           dto.ville ?? 'Kinshasa',
          phone:          dto.restaurantPhone ?? dto.phone,
          description:    dto.description,
          categories:     dto.categories ?? [],
          subscription:   dto.subscription as any ?? 'MAMAN',
          restaurantType: dto.restaurantType as any ?? 'SUR_PLACE',
          addressId:      address.id,
        },
        select: {
          id: true, name: true, subscription: true, address: true,
        },
      });

      return { user: createdUser, restaurant: createdRestaurant };
    });

    return {
      user: {
        id:        user.id,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        role:      user.role,
      },
      restaurant,
      message: 'Compte restaurant créé avec succès',
    };
  }

  // ─── GESTION RESTAURANTS ─────────────────────────────────────────────────────

  async getRestaurants(filters: RestaurantFiltersDto) {
    const { search, subscription, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name:    { contains: search, mode: 'insensitive' } },
        { city:    { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (subscription) where.subscription = subscription;

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          subscription: true,
          subscriptionExpiresAt: true,
          isActive: true,
          isOpen: true,
          rating: true,
          reviewCount: true,
          imageUrl: true,
          createdAt: true,
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { reservations: true, orders: true },
          },
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: restaurants,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async toggleRestaurantStatus(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    return this.prisma.restaurant.update({
      where: { id },
      data: { isActive: !restaurant.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  async changeRestaurantSubscription(id: string, dto: ChangeSubscriptionDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    return this.prisma.restaurant.update({
      where: { id },
      data: { subscription: dto.subscription as any },
      select: { id: true, name: true, subscription: true },
    });
  }

  // ─── COMMANDES ───────────────────────────────────────────────────────────────

  async getOrders(filters: OrderFiltersDto) {
    const { search, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { restaurant: { name: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: search, mode: 'insensitive' } } },
        { user: { email:     { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id:         true,
          status:     true,
          totalCents: true,
          createdAt:  true,
          restaurant: { select: { id: true, name: true } },
          user:       { select: { id: true, firstName: true, lastName: true, email: true } },
          _count:     { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  // ─── GESTION ADRESSES ────────────────────────────────────────────────────────

  async getAddresses() {
    return this.prisma.address.findMany({
      orderBy: [{ ville: 'asc' }, { commune: 'asc' }],
      include: {
        _count: { select: { users: true, restaurants: true } },
      },
    });
  }
}

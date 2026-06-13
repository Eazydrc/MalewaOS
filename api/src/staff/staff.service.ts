import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import * as bcrypt from 'bcrypt';

const CROISSANCE_TIERS = ['CROISSANCE', 'DOMINATION'];
const DOMINATION_TIERS = ['DOMINATION'];

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedRestaurant(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Aucun restaurant trouvé');
    if (!CROISSANCE_TIERS.includes(restaurant.subscription))
      throw new ForbiddenException('Gestion du personnel disponible à partir du pack Croissance');
    return restaurant;
  }

  async findAll(ownerId: string) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    return this.prisma.staffMember.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ isActive: 'desc' }, { role: 'asc' }, { firstName: 'asc' }],
    });
  }

  async create(ownerId: string, dto: CreateStaffDto) {
    const restaurant = await this.getOwnedRestaurant(ownerId);
    return this.prisma.staffMember.create({
      data: { restaurantId: restaurant.id, ...dto },
    });
  }

  async update(id: string, ownerId: string, dto: UpdateStaffDto) {
    await this.assertOwner(id, ownerId);
    return this.prisma.staffMember.update({ where: { id }, data: dto });
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwner(id, ownerId);
    await this.prisma.staffMember.delete({ where: { id } });
    return { message: 'Membre supprimé' };
  }

  private async assertOwner(id: string, ownerId: string) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { restaurant: true },
    });
    if (!member) throw new NotFoundException('Membre introuvable');
    if (member.restaurant.ownerId !== ownerId) throw new ForbiddenException();
    return member;
  }

  async createLogin(staffId: string, ownerId: string, email: string, password: string) {
    const member = await this.assertOwner(staffId, ownerId);

    if (!DOMINATION_TIERS.includes(member.restaurant.subscription))
      throw new ForbiddenException('Comptes staff disponibles uniquement avec le pack Domination');

    if (member.userId)
      throw new ConflictException('Ce membre possède déjà un compte');

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    // Validation de la complexité du mot de passe
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un symbole',
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName: member.firstName,
        lastName:  member.lastName,
        role:      'STAFF',
        isActive:  true,
        emailVerified: true,
      },
    });

    await this.prisma.staffMember.update({
      where: { id: staffId },
      data:  { userId: user.id },
    });

    return { message: 'Compte créé' };
  }

  async removeLogin(staffId: string, ownerId: string) {
    const member = await this.assertOwner(staffId, ownerId);

    if (!member.userId) throw new NotFoundException('Ce membre n\'a pas de compte');

    const userIdToDelete = member.userId;

    await this.prisma.$transaction(async (tx) => {
      // Supprimer l'utilisateur EN PREMIER pour respecter les contraintes FK
      await tx.user.delete({ where: { id: userIdToDelete } });
      // Détacher la référence sur le staffMember
      await tx.staffMember.update({
        where: { id: staffId },
        data:  { userId: null },
      });
    });

    return { message: 'Compte supprimé' };
  }
}

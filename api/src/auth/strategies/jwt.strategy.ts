import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error(
        '[FATAL] JWT_ACCESS_SECRET est manquant dans les variables d\'environnement. ' +
        'L\'application refuse de démarrer sans secret JWT configuré.',
      );
    }
    super({
      // Cherche le token dans le cookie HttpOnly en priorité,
      // puis dans l'header Authorization (Postman / apps mobiles)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey:      secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, email: true, role: true, isActive: true,
        firstName: true, lastName: true, avatarUrl: true, points: true,
      },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Compte inactif ou introuvable');
    return user;
  }
}

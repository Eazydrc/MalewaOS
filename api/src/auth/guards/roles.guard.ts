import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Hiérarchie : SUPER_ADMIN > ADMIN > RESTAURANT > CLIENT
const ROLE_RANK: Record<string, number> = {
  CLIENT:      0,
  RESTAURANT:  1,
  ADMIN:       2,
  SUPER_ADMIN: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const userRank = ROLE_RANK[user.role] ?? 0;

    // L'utilisateur passe si son rang est >= au rang minimum requis
    const minRequiredRank = Math.min(
      ...required.map(r => ROLE_RANK[r] ?? 99),
    );

    return userRank >= minRequiredRank;
  }
}

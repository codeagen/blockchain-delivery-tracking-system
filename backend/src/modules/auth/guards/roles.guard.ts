import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '../../../common/enums/role.enum';
import { JwtPayload } from '../jwt-payload.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RBAC guard. Reads the roles required by the handler (set via @Roles) and
 * compares them against the authenticated user's role. Mirrors the on-chain
 * access rules so the API rejects unauthorized callers before any chain call.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Allow the request when no roles are required, or when the user's role is
   * among the required set; otherwise deny with 403.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles declared -> any authenticated user may proceed.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Your role is not permitted to perform this action.',
      );
    }
    return true;
  }
}

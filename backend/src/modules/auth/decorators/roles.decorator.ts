import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';

/** Metadata key under which required roles are stored on a handler. */
export const ROLES_KEY = 'roles';

/**
 * Route decorator declaring which roles may access a handler. Read by the
 * RolesGuard to enforce RBAC, e.g. `@Roles(Role.SELLER)`.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

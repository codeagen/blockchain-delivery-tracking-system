import { Role } from '../../common/enums/role.enum';

/**
 * Claims embedded in the signed JWT and rehydrated onto request.user after
 * the JWT strategy validates a token.
 */
export interface JwtPayload {
  /** Subject = user id. */
  sub: string;
  /** User email. */
  email: string;
  /** User role (used by the RolesGuard). */
  role: Role;
  /** User's Ethereum address (used when forwarding to the chain). */
  ethereumAddress: string;
}

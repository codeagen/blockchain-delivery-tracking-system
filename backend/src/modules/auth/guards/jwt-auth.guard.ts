import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that enforces a valid JWT on a route. Applied to every protected
 * endpoint; populates request.user with the JwtPayload on success.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

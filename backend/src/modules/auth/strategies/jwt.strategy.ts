import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../jwt-payload.interface';

/**
 * Passport JWT strategy. Extracts a Bearer token, verifies its signature with
 * JWT_SECRET, and returns the payload which Nest attaches to request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      // Fail fast at startup if the signing secret is missing.
      throw new Error('JWT_SECRET is not set in the environment.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validate the decoded token. Passport has already verified the signature;
   * here we simply shape the value placed on request.user.
   */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload.');
    }
    return payload;
  }
}

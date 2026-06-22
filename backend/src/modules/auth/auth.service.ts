import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Wallet } from 'ethers';
import { UsersService } from '../users/users.service';
import { SafeUser } from '../users/user.entity';
import { BlockchainService } from '../blockchain/blockchain.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

/** Number of bcrypt salt rounds used when hashing passwords. */
const BCRYPT_ROUNDS = 10;

/** Response returned after a successful register/login. */
export interface AuthResult {
  /** Signed JWT access token. */
  accessToken: string;
  /** The authenticated user without the password hash. */
  user: SafeUser;
}

/**
 * AuthService holds all authentication logic: registration (hashing), login
 * (credential verification) and JWT issuance. Controllers only route to it.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly blockchain: BlockchainService,
  ) {}

  /**
   * Register a new user: hash the password, generate a custodial wallet (the
   * user's on-chain identity), store the record, and return a token. The new
   * wallet is funded best-effort so it can pay gas; if the chain is not yet
   * configured, registration still succeeds and funding is skipped.
   */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Generate a real keypair the backend custodies on the user's behalf.
    const wallet = Wallet.createRandom();
    const user = await this.users.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      ethereumAddress: wallet.address,
      privateKey: wallet.privateKey,
    });

    // Fund the wallet so it can sign its own transactions. Best-effort: never
    // block account creation on chain availability.
    try {
      await this.blockchain.fundWallet(wallet.address);
    } catch (err) {
      this.logger.warn(
        `Could not fund wallet ${wallet.address} (chain unavailable?): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return this.buildResult(user.id);
  }

  /**
   * Verify credentials and issue a token, or throw 401 on mismatch.
   */
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.buildResult(user.id);
  }

  /**
   * Build the auth response (token + safe user) for a stored user id.
   */
  private async buildResult(userId: string): Promise<AuthResult> {
    const user = await this.users.findById(userId);
    if (!user) {
      // Should not happen immediately after create/login.
      throw new UnauthorizedException('User not found.');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ethereumAddress: user.ethereumAddress,
    };
    const accessToken = this.jwt.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        ethereumAddress: user.ethereumAddress,
      },
    };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { SafeUser, User } from './user.entity';

/**
 * Parameters required to create a new user record.
 */
export interface CreateUserParams {
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  ethereumAddress: string;
  privateKey: string;
}

/**
 * UsersService is the off-chain store of user/auth records, backed by Postgres
 * via a TypeORM repository.
 *
 * IMPORTANT: this is an OFF-CHAIN CACHE only. The blockchain remains the system
 * of record for delivery state. User identity/auth legitimately lives off-chain.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /**
   * Create and persist a new user. Rejects duplicate emails.
   */
  async create(params: CreateUserParams): Promise<User> {
    if (await this.findByEmail(params.email)) {
      throw new ConflictException('A user with this email already exists.');
    }
    const user = this.users.create({
      fullName: params.fullName,
      email: params.email.toLowerCase(),
      passwordHash: params.passwordHash,
      role: params.role,
      ethereumAddress: params.ethereumAddress,
      privateKey: params.privateKey,
    });
    return this.users.save(user);
  }

  /**
   * Look up a user by email (case-insensitive). Returns null if absent.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  /**
   * Look up a user by internal id. Returns null if absent.
   */
  async findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  /**
   * List all users as safe records (no secrets) for address discovery.
   */
  async listSafe(): Promise<SafeUser[]> {
    const users = await this.users.find();
    return users.map((user) => this.toSafe(user));
  }

  /**
   * Find one user by email as a safe record. Throws 404 if not found.
   */
  async getSafeByEmail(email: string): Promise<SafeUser> {
    if (!email) {
      throw new NotFoundException('User not found.');
    }
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return this.toSafe(user);
  }

  /**
   * Strip secrets, returning only fields safe to expose over the API.
   */
  private toSafe(user: User): SafeUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      ethereumAddress: user.ethereumAddress,
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Role } from '../../common/enums/role.enum';

/**
 * Unit tests for AuthService using the real UsersService backed by an in-memory
 * fake of the TypeORM repository, a test JWT secret, and a mocked
 * BlockchainService (no chain). Verifies registration issues a token and
 * generates a custodial wallet, and that login validates credentials.
 */
describe('AuthService', () => {
  let service: AuthService;

  const registerDto = {
    fullName: 'Test Seller',
    email: 'seller@example.com',
    password: 'password123',
    role: Role.SELLER,
  };

  // Mocked chain client — funding is best-effort and must not hit a real node.
  const blockchainMock = {
    fundWallet: jest.fn().mockResolvedValue(undefined),
  };

  // In-memory fake of Repository<User> covering the methods UsersService uses.
  const buildUserRepoMock = () => {
    const rows: User[] = [];
    return {
      create: (data: Partial<User>): User => ({ ...(data as User) }),
      save: (user: User): Promise<User> => {
        const saved = { ...user, id: user.id ?? `${rows.length + 1}` };
        rows.push(saved);
        return Promise.resolve(saved);
      },
      findOne: ({
        where,
      }: {
        where: Partial<Pick<User, 'id' | 'email'>>;
      }): Promise<User | null> =>
        Promise.resolve(
          rows.find(
            (u) =>
              (where.id === undefined || u.id === where.id) &&
              (where.email === undefined || u.email === where.email),
          ) ?? null,
        ),
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      providers: [
        AuthService,
        UsersService,
        { provide: getRepositoryToken(User), useValue: buildUserRepoMock() },
        { provide: BlockchainService, useValue: blockchainMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('generates a custodial Ethereum wallet on registration', async () => {
    const result = await service.register(registerDto);
    expect(result.user.ethereumAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(blockchainMock.fundWallet).toHaveBeenCalledWith(
      result.user.ethereumAddress,
    );
  });

  it('registers a user and returns an access token', async () => {
    const result = await service.register(registerDto);
    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('seller@example.com');
    expect(result.user.role).toBe(Role.SELLER);
    // The safe user must not leak the password hash.
    expect(
      (result.user as unknown as Record<string, unknown>).passwordHash,
    ).toBeUndefined();
  });

  it('logs in with valid credentials', async () => {
    await service.register(registerDto);
    const result = await service.login({
      email: registerDto.email,
      password: registerDto.password,
    });
    expect(result.accessToken).toBeDefined();
  });

  it('rejects login with a wrong password', async () => {
    await service.register(registerDto);
    await expect(
      service.login({ email: registerDto.email, password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

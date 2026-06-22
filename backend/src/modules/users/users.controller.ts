import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SafeUser } from './user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * UsersController exposes read-only user lookup so callers can resolve another
 * user's Ethereum address (e.g. a seller finding a customer, an admin finding an
 * agent). It returns safe records only and never exposes secrets.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /users — list all registered users (safe fields) for address lookup. */
  @Get()
  @ApiOperation({ summary: 'List all registered users (for address lookup)' })
  findAll(): Promise<SafeUser[]> {
    return this.users.listSafe();
  }

  /** GET /users/by-email?email= — resolve a single user (safe fields) by email. */
  @Get('by-email')
  @ApiOperation({ summary: 'Find a user by email (for address lookup)' })
  findByEmail(@Query('email') email: string): Promise<SafeUser> {
    return this.users.getSafeByEmail(email);
  }
}

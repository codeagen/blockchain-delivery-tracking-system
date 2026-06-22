import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

/**
 * Payload for registering a new user. The user's on-chain identity is NOT
 * supplied here — the backend generates a custodial wallet at signup, so callers
 * only provide their name, credentials and a role.
 */
export class RegisterDto {
  @ApiProperty({
    description: "User's full name (display only).",
    example: 'Ada Lovelace',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    description: 'Unique login email.',
    example: 'seller@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Plaintext password (hashed before storage); minimum 8 chars.',
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Application role driving RBAC.',
    example: Role.SELLER,
  })
  @IsEnum(Role)
  role!: Role;
}

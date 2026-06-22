import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * Payload for logging in an existing user.
 */
export class LoginDto {
  @ApiProperty({
    description: 'Registered login email.',
    example: 'seller@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Plaintext password to verify against the stored hash.',
    example: 'password123',
  })
  @IsString()
  password!: string;
}

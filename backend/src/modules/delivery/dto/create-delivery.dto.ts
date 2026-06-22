import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Payload for creating a delivery (SELLER). The seller is the backend signer;
 * the customer address and description are supplied by the caller.
 */
export class CreateDeliveryDto {
  @ApiProperty({
    description: 'Ethereum address of the customer who will confirm receipt.',
    example: '0x2222222222222222222222222222222222222222',
  })
  @IsEthereumAddress()
  customer!: string;

  @ApiProperty({
    description: 'Human-readable description of the package.',
    example: 'Box of 3 hardcover books',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;
}

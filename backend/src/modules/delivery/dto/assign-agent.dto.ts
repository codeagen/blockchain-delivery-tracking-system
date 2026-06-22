import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';

/**
 * Payload for assigning a delivery agent to a delivery (ADMIN).
 */
export class AssignAgentDto {
  @ApiProperty({
    description: 'Ethereum address of the agent to assign.',
    example: '0x3333333333333333333333333333333333333333',
  })
  @IsEthereumAddress()
  agent!: string;
}

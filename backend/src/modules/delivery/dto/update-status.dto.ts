import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../../blockchain/delivery-status.enum';

/**
 * Payload for advancing a delivery's status (AGENT). The contract enforces
 * forward-only transitions; this DTO just validates the target is a real status.
 */
export class UpdateStatusDto {
  @ApiProperty({
    description:
      'Target status (numeric, matching the on-chain enum: ' +
      'CREATED=0, ASSIGNED=1, DISPATCHED=2, IN_TRANSIT=3, DELIVERED=4).',
    example: DeliveryStatus.DISPATCHED,
  })
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;
}

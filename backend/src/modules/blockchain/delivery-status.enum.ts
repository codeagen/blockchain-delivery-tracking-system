/**
 * On-chain delivery lifecycle status. The numeric values MUST match the
 * Solidity `Status` enum exactly (CREATED=0 .. DELIVERED=4) because they are
 * passed to / read from the contract as uint8.
 */
export enum DeliveryStatus {
  CREATED = 0,
  ASSIGNED = 1,
  DISPATCHED = 2,
  IN_TRANSIT = 3,
  DELIVERED = 4,
}

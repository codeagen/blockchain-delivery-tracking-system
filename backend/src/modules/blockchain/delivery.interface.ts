import { DeliveryStatus } from './delivery-status.enum';

/**
 * Off-chain TypeScript representation of an on-chain Delivery record.
 * Mirrors the Solidity `Delivery` struct returned by `getDelivery`.
 * The blockchain is the system of record; this shape is only how the backend
 * surfaces that data to callers after mapping the raw ethers `Result`.
 */
export interface Delivery {
  /** Sequential on-chain delivery id. */
  id: number;
  /** Ethereum address of the seller who created the delivery. */
  seller: string;
  /** Ethereum address of the customer who will confirm receipt. */
  customer: string;
  /** Ethereum address of the assigned delivery agent (zero address if none). */
  agent: string;
  /** Human-readable description of the package. */
  description: string;
  /** Current lifecycle status. */
  status: DeliveryStatus;
  /** Unix timestamp (seconds) when the delivery was created on-chain. */
  createdAt: number;
  /** Unix timestamp (seconds) of the last on-chain update. */
  updatedAt: number;
}

/**
 * Result of a state-changing chain call: the resulting delivery id (when known)
 * and the mined transaction hash, which the backend caches off-chain for fast
 * lookup as required by the design.
 */
export interface ChainWriteResult {
  /** Delivery id affected by the transaction. */
  id: number;
  /** Hash of the submitted transaction. */
  txHash: string;
}

/**
 * Shared domain types for the frontend. These mirror the shapes the NestJS
 * backend exposes over REST (which in turn mirror the on-chain contract).
 * The frontend never talks to the chain directly — only to the backend.
 */

/** Application roles, matching the backend `Role` enum exactly. */
export enum Role {
  SELLER = "SELLER",
  AGENT = "AGENT",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}

/**
 * On-chain delivery lifecycle status. Numeric values MUST match the backend /
 * Solidity enum (CREATED=0 .. DELIVERED=4) because the API sends/receives them
 * as numbers.
 */
export enum DeliveryStatus {
  CREATED = 0,
  ASSIGNED = 1,
  DISPATCHED = 2,
  IN_TRANSIT = 3,
  DELIVERED = 4,
}

/** A user as returned by the backend (no password hash). */
export interface User {
  id: string;
  fullName?: string;
  email: string;
  role: Role;
  ethereumAddress: string;
}

/** The JWT payload shape returned by `GET /auth/me`. */
export interface MeResponse {
  sub: string;
  email: string;
  role: Role;
  ethereumAddress: string;
}

/** Response of a successful register/login. */
export interface AuthResult {
  accessToken: string;
  user: User;
}

/** A delivery record as surfaced by the backend (mirrors the on-chain struct). */
export interface Delivery {
  id: number;
  seller: string;
  customer: string;
  agent: string;
  description: string;
  status: DeliveryStatus;
  /** Unix timestamp (seconds) the delivery was created on-chain. */
  createdAt: number;
  /** Unix timestamp (seconds) of the last on-chain update. */
  updatedAt: number;
}

/** A single delivery plus the cached transaction hashes for it. */
export interface DeliveryWithTxHashes extends Delivery {
  txHashes: string[];
}

/** Payload to register a new user. The backend generates the custodial wallet. */
export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

/** Payload to log in. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Payload to create a delivery (seller). */
export interface CreateDeliveryPayload {
  /** Ethereum address of the customer who will confirm receipt. */
  customer: string;
  /** Human-readable description of the package. */
  description: string;
}

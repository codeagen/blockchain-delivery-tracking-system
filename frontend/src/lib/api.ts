import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  AuthResult,
  CreateDeliveryPayload,
  Delivery,
  DeliveryStatus,
  DeliveryWithTxHashes,
  LoginPayload,
  MeResponse,
  RegisterPayload,
} from "./types";

/**
 * Centralised API client. ALL backend calls go through this module so the
 * frontend has a single, consistent integration point with the NestJS API
 * (and never touches the blockchain directly).
 */

/** localStorage key under which the JWT access token is persisted. */
const TOKEN_KEY = "cd_access_token";

/** Read the stored JWT, or null when running on the server / when absent. */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

/** Persist the JWT for subsequent authenticated requests. */
export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

/** Remove the stored JWT (used on logout). */
export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/** Axios instance pointed at the backend, base URL taken from the environment. */
const client: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});

/** Attach the bearer token (when present) to every outgoing request. */
client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Convert an unknown thrown value into a human-readable message, preferring the
 * backend's error message so forms can surface a meaningful reason.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/* -------------------------------- Auth --------------------------------- */

/** Register a new user and return the token + user. */
export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const { data } = await client.post<AuthResult>("/auth/register", payload);
  return data;
}

/** Log in with email/password and return the token + user. */
export async function login(payload: LoginPayload): Promise<AuthResult> {
  const { data } = await client.post<AuthResult>("/auth/login", payload);
  return data;
}

/** Fetch the currently authenticated user's profile from the JWT. */
export async function getMe(): Promise<MeResponse> {
  const { data } = await client.get<MeResponse>("/auth/me");
  return data;
}

/* ------------------------------ Deliveries ----------------------------- */

/** List every delivery (the backend returns all; callers filter by role). */
export async function listDeliveries(): Promise<Delivery[]> {
  const { data } = await client.get<Delivery[]>("/deliveries");
  return data;
}

/** Fetch a single delivery plus its cached transaction hashes. */
export async function getDelivery(id: number): Promise<DeliveryWithTxHashes> {
  const { data } = await client.get<DeliveryWithTxHashes>(`/deliveries/${id}`);
  return data;
}

/** Create a new delivery (seller only). */
export async function createDelivery(
  payload: CreateDeliveryPayload,
): Promise<Delivery> {
  const { data } = await client.post<Delivery>("/deliveries", payload);
  return data;
}

/** Advance a delivery's status (assigned agent only). */
export async function updateDeliveryStatus(
  id: number,
  status: DeliveryStatus,
): Promise<Delivery> {
  const { data } = await client.patch<Delivery>(`/deliveries/${id}/status`, {
    status,
  });
  return data;
}

/** Confirm receipt of a delivery (assigned customer only). */
export async function confirmDelivery(id: number): Promise<Delivery> {
  const { data } = await client.post<Delivery>(`/deliveries/${id}/confirm`);
  return data;
}

import { DeliveryStatus, Role } from "./types";

/** Human-readable label for each lifecycle status. */
export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  [DeliveryStatus.CREATED]: "Created",
  [DeliveryStatus.ASSIGNED]: "Assigned",
  [DeliveryStatus.DISPATCHED]: "Dispatched",
  [DeliveryStatus.IN_TRANSIT]: "In Transit",
  [DeliveryStatus.DELIVERED]: "Delivered",
};

/**
 * Soft, muted badge colours per status, matching the Veridel palette. The two
 * pre-handover stages (created / assigned) stay neutral stone; only the three
 * stages an agent or customer acts on carry colour — amber (dispatched),
 * blue (in transit), green (delivered). Light mode only, no dark variants.
 */
export const STATUS_BADGE_CLASSES: Record<DeliveryStatus, string> = {
  [DeliveryStatus.CREATED]:
    "bg-stone-100 text-stone-600 border-stone-200",
  [DeliveryStatus.ASSIGNED]:
    "bg-stone-100 text-stone-600 border-stone-200",
  [DeliveryStatus.DISPATCHED]:
    "bg-amber-50 text-amber-700 border-amber-200",
  [DeliveryStatus.IN_TRANSIT]:
    "bg-blue-50 text-blue-700 border-blue-200",
  [DeliveryStatus.DELIVERED]:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/** The lifecycle in strict order — used to render the delivery timeline. */
export const STATUS_ORDER: DeliveryStatus[] = [
  DeliveryStatus.CREATED,
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.DISPATCHED,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.DELIVERED,
];

/** Safe label lookup for a status value. */
export function formatStatus(status: DeliveryStatus): string {
  return STATUS_LABELS[status] ?? "Unknown";
}

/** Display label for each role. */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.SELLER]: "Seller",
  [Role.AGENT]: "Delivery Agent",
  [Role.CUSTOMER]: "Customer",
  [Role.ADMIN]: "Admin",
};

/** Shorten an Ethereum address to `0x1234…abcd` for compact display. */
export function formatAddress(address?: string | null): string {
  if (!address) return "—";
  // The zero address means "unassigned" (e.g. no agent yet) — show a dash.
  if (/^0x0+$/i.test(address)) return "—";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Format a Unix-seconds timestamp as a readable local date/time. */
export function formatTimestamp(unixSeconds?: number | null): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

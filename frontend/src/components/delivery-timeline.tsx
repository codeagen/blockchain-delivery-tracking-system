import { Check } from "lucide-react";
import { STATUS_ORDER, formatStatus, formatTimestamp } from "@/lib/status";
import { DeliveryStatus, type Delivery } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Vertical lifecycle timeline for a delivery.
 *
 * Honest data note: the on-chain record only stores `createdAt` and `updatedAt`
 * (there are no per-status timestamps). So we show `createdAt` on the Created
 * node and `updatedAt` on the current node; intermediate steps are marked
 * done/pending purely from the current status — no timestamps are invented.
 */
export function DeliveryTimeline({ delivery }: { delivery: Delivery }) {
  return (
    <ol className="relative space-y-0">
      {STATUS_ORDER.map((status, index) => {
        const isDone = delivery.status >= status;
        const isLatest = delivery.status === status;
        // The terminal DELIVERED state is "done" (green), not an in-progress
        // "current" node — only non-final reached stages pulse as current.
        const isCurrent = isLatest && status !== DeliveryStatus.DELIVERED;
        const isLast = index === STATUS_ORDER.length - 1;

        // Choose the one timestamp we can honestly attach to this node.
        let when: string | null = null;
        if (status === DeliveryStatus.CREATED) {
          when = formatTimestamp(delivery.createdAt);
        } else if (isLatest) {
          when = formatTimestamp(delivery.updatedAt);
        }

        return (
          <li key={status} className="flex gap-3 pb-5 last:pb-0">
            {/* Node + connecting line */}
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex size-6 items-center justify-center rounded-full border text-[10px]",
                  isCurrent &&
                    "border-blue-400 bg-blue-50 text-blue-700 ring-4 ring-blue-100",
                  isDone && !isCurrent &&
                    "border-emerald-400 bg-emerald-50 text-emerald-700",
                  !isDone &&
                    "border-border bg-card text-muted-foreground",
                )}
              >
                {isDone && !isCurrent ? (
                  <Check className="size-3.5" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1",
                    isDone ? "bg-emerald-300" : "bg-border",
                  )}
                />
              )}
            </div>

            {/* Step label + timestamp */}
            <div className="-mt-0.5 pb-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  !isDone && "text-muted-foreground",
                )}
              >
                {formatStatus(status)}
                {isCurrent && (
                  <span className="ml-2 text-xs font-normal text-blue-700">
                    current
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {when ?? (isDone ? "completed" : "pending")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

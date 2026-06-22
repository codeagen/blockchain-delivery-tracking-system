import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_CLASSES, formatStatus } from "@/lib/status";
import type { DeliveryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Coloured pill showing a delivery's lifecycle status. */
export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <Badge className={cn(STATUS_BADGE_CLASSES[status])}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {formatStatus(status)}
    </Badge>
  );
}

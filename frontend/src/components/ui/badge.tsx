import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Small pill label. Colours are passed in via `className` (e.g. the status
 * colour map) so this stays a neutral, reusable primitive.
 */
function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };

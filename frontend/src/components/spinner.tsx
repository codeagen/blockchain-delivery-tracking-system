import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small inline loading spinner used in buttons and loading states. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

/** Centred full-area loading indicator with optional label. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

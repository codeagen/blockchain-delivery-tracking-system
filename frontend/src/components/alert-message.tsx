import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inline error message block for forms and data-loading failures. */
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-app)] border px-3 py-2 text-sm",
        "border-red-200 bg-red-50 text-red-700",
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/** Inline success message block for confirmed actions. */
export function SuccessMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-app)] border px-3 py-2 text-sm",
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

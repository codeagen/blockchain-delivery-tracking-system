import * as React from "react";
import { cn } from "@/lib/utils";

/** Surface container with a very light border and slight rounding. */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[calc(var(--radius-app)+0.25rem)] border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Header region of a Card. */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1 p-5 pb-3", className)}
      {...props}
    />
  );
}

/** Prominent card title. */
function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("font-display text-base font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

/** Secondary description text under a title. */
function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/** Main body region of a Card. */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

/** Footer region of a Card (actions, meta). */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center p-5 pt-0", className)} {...props} />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};

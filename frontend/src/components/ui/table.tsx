import * as React from "react";
import { cn } from "@/lib/utils";

/** Minimal table with light row dividers only (no vertical lines / zebra). */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

/** Table header group. */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
}

/** Table body group with light dividers between rows. */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:not(:last-child)]:border-b [&_tr]:border-border", className)}
      {...props}
    />
  );
}

/** A table row. */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("transition-colors hover:bg-muted/50", className)}
      {...props}
    />
  );
}

/** Header cell. */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-10 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Body cell. */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn("px-3 py-3 align-middle", className)} {...props} />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };

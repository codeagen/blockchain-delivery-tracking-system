"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS, formatAddress } from "@/lib/status";

/**
 * Minimal top navigation bar: Veridel brand mark on the left, the signed-in
 * user's identity (email + role) and a logout button on the right. Paper
 * background, a single light bottom border, no shadow.
 */
export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  /** Clear the session and return to the login screen. */
  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none text-brand">⬢</span>
          <span className="font-display text-base font-bold tracking-tight">
            Veridel
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-medium">{user.email}</span>
              <span className="text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]} · {formatAddress(user.ethereumAddress)}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

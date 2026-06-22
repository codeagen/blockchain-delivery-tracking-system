"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { LoadingState } from "@/components/spinner";
import { useAuth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/routes";
import type { Role } from "@/lib/types";

/**
 * Client-side route guard for role-specific screens. Redirects unauthenticated
 * users to /login and users with the wrong role to their own dashboard, then
 * renders the page inside the shared shell (navbar + centered container).
 *
 * This mirrors (does not replace) the backend RBAC — the API remains the
 * authoritative gate; this is purely for UX.
 */
export function AuthGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, loading, role, router]);

  // While restoring the session or before a redirect resolves, show a spinner.
  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ErrorMessage } from "@/components/alert-message";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/routes";
import { ROLE_LABELS } from "@/lib/status";
import { Role } from "@/lib/types";

/** The roles a user can self-register as (admin is provisioned separately). */
const SELECTABLE_ROLES: Role[] = [Role.SELLER, Role.AGENT, Role.CUSTOMER];

/**
 * Registration screen. Collects full name, credentials and a role; the backend
 * generates a custodial wallet for the user, so no Ethereum address is entered here.
 */
export default function RegisterPage() {
  const { user, loading: sessionLoading, register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.CUSTOMER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, skip the form.
  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, sessionLoading, router]);

  /** Validate inputs client-side, then create the account. */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await register({ fullName, email, password, role });
      router.replace(dashboardPathForRole(created.role));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      description="Register to start recording deliveries on-chain."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <ErrorMessage message={error} />}

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {SELECTABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}

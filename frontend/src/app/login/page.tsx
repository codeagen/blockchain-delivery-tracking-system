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
import { getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/routes";

/** Login screen: email + password, then redirect to the role dashboard. */
export default function LoginPage() {
  const { user, loading: sessionLoading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, skip the form.
  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, sessionLoading, router]);

  /** Submit credentials, then navigate to the user's dashboard. */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await login({ email, password });
      router.replace(dashboardPathForRole(signedIn.role));
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="Access your delivery dashboard."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <ErrorMessage message={error} />}

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
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}

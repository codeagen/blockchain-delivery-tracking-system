"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { LoadingState } from "@/components/spinner";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/routes";

/** The three honest, in-scope properties the on-chain ledger actually provides. */
const PROPERTIES = [
  { k: "IMMUTABLE", v: "Records can't be edited once written to the chain." },
  { k: "TRANSPARENT", v: "Every party reads the same verified history." },
  { k: "AUTOMATED", v: "The smart contract records status on each event." },
] as const;

/**
 * Public landing page. Signed-in visitors are sent straight to their dashboard;
 * everyone else sees the Veridel hero with Login / Create account entry points.
 */
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, loading, router]);

  // While the session restores, or just before redirecting an authed user.
  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Square graph-paper grid, fading out toward the bottom (Veridel). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          opacity: 0.6,
          WebkitMaskImage: "linear-gradient(#000, transparent 65%)",
          maskImage: "linear-gradient(#000, transparent 65%)",
        }}
      />

      {/* Top bar: brand + tagline */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <span className="flex items-center gap-2">
          <span className="text-lg leading-none text-brand">⬢</span>
          <span className="font-display text-lg font-bold tracking-tight">
            Veridel
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          DELIVERY · ON-CHAIN
        </span>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col justify-center gap-5 px-5 py-10 sm:px-8 sm:py-16 md:max-w-2xl">
        <p className="font-mono text-xs tracking-[0.12em] text-brand">
          BLOCKCHAIN-BASED DELIVERY MANAGEMENT
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          Every handover,
          <br />
          <span className="relative whitespace-nowrap">
            <span
              className="absolute inset-x-0 bottom-1 -z-0 h-[0.4em] rounded-sm bg-accent-soft"
              aria-hidden
            />
            <span className="relative">permanently provable.</span>
          </span>
        </h1>
        <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          A delivery ledger no single party can alter. Sellers get tamper-proof
          proof of delivery, agents get a clear record of their work, and
          customers can independently verify a package — without trusting one
          company&apos;s dashboard.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Log in
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Create account
          </Link>
        </div>
        <p className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
          Secured on Ethereum · Solidity smart contracts
        </p>
      </section>

      {/* Property strip */}
      <section className="relative z-10 grid border-t border-border bg-card/60 sm:grid-cols-3">
        {PROPERTIES.map((p, i) => (
          <div
            key={p.k}
            className={`flex flex-col gap-1 px-5 py-4 sm:px-8 ${
              i < PROPERTIES.length - 1 ? "border-b border-border sm:border-b-0 sm:border-r" : ""
            }`}
          >
            <span className="font-mono text-[10.5px] tracking-[0.1em] text-brand">
              {p.k}
            </span>
            <span className="text-[13.5px] text-muted-foreground">{p.v}</span>
          </div>
        ))}
      </section>
    </main>
  );
}

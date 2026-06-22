"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Truck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { DeliveryTimeline } from "@/components/delivery-timeline";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAddress, formatTimestamp } from "@/lib/status";
import { DeliveryStatus, Role, type Delivery } from "@/lib/types";

/**
 * Dev-only UI preview. Renders all three role dashboards with hard-coded
 * sample data so the design can be reviewed without logging in or running the
 * backend. This route is NOT part of the real app flow — none of the buttons
 * call the API. Safe to delete.
 */

const SELLER = "0xAa11223344556677889900aAbBcCdDeEfF001122";
const CUSTOMER = "0xBb2233445566778899aabbccddeeff0011223344";
const AGENT = "0xCc33445566778899aabbccddeeff001122334455";
const ZERO = "0x0000000000000000000000000000000000000000";

// A spread of statuses so every badge / timeline state is visible.
const SAMPLE: Delivery[] = [
  { id: 2041, seller: SELLER, customer: CUSTOMER, agent: AGENT, description: "Electronics · 2.4kg", status: DeliveryStatus.IN_TRANSIT, createdAt: 1717000000, updatedAt: 1717200000 },
  { id: 2039, seller: SELLER, customer: CUSTOMER, agent: AGENT, description: "Documents · 0.3kg", status: DeliveryStatus.DELIVERED, createdAt: 1716000000, updatedAt: 1716400000 },
  { id: 2044, seller: SELLER, customer: CUSTOMER, agent: AGENT, description: "Apparel · 1.1kg", status: DeliveryStatus.DISPATCHED, createdAt: 1717100000, updatedAt: 1717150000 },
  { id: 2052, seller: SELLER, customer: CUSTOMER, agent: AGENT, description: "Home goods · 4.0kg", status: DeliveryStatus.ASSIGNED, createdAt: 1717180000, updatedAt: 1717185000 },
  { id: 2031, seller: SELLER, customer: CUSTOMER, agent: ZERO, description: "Books · 0.8kg", status: DeliveryStatus.CREATED, createdAt: 1717050000, updatedAt: 1717050000 },
];

type PreviewRole = Role.SELLER | Role.AGENT | Role.CUSTOMER;

const ROLE_TABS: { role: PreviewRole; label: string }[] = [
  { role: Role.SELLER, label: "Seller" },
  { role: Role.AGENT, label: "Agent" },
  { role: Role.CUSTOMER, label: "Customer" },
];

export default function PreviewPage() {
  const [role, setRole] = useState<PreviewRole>(Role.SELLER);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Preview notice + role switcher */}
      <div className="border-b border-border bg-card/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground">
            UI PREVIEW · SAMPLE DATA · NO LOGIN · NO BACKEND
          </p>
          <div className="flex items-center gap-2">
            {ROLE_TABS.map((t) => (
              <Button
                key={t.role}
                size="sm"
                variant={role === t.role ? "default" : "outline"}
                onClick={() => setRole(t.role)}
              >
                {t.label}
              </Button>
            ))}
            <Link
              href="/"
              className="ml-1 font-mono text-[11px] text-brand hover:underline"
            >
              exit ↗
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {role === Role.SELLER && <SellerPreview />}
        {role === Role.AGENT && <AgentPreview />}
        {role === Role.CUSTOMER && <CustomerPreview />}
      </main>
    </div>
  );
}

/* ----------------------------- Seller ----------------------------- */
function SellerPreview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Your deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Create delivery orders and follow their on-chain status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New delivery</CardTitle>
          <CardDescription>Record a new package on the ledger for a customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Customer Ethereum address</Label>
                <Input placeholder="0x…" defaultValue={CUSTOMER} className="font-mono" readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>Package description</Label>
                <Input placeholder="e.g. Electronics · 2.4kg" defaultValue="Electronics · 2.4kg" readOnly />
              </div>
            </div>
            <Button type="button">
              <Plus className="size-4" />
              Create &amp; record on ledger
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Created deliveries</CardTitle>
          <CardDescription>{SAMPLE.length} deliveries.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">#{d.id}</TableCell>
                  <TableCell className="max-w-xs truncate">{d.description}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatAddress(d.customer)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatAddress(d.agent)}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatTimestamp(d.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- Agent ------------------------------ */
function nextStepLabel(status: DeliveryStatus): string | null {
  if (status === DeliveryStatus.ASSIGNED) return "Mark dispatched";
  if (status === DeliveryStatus.DISPATCHED) return "Mark in transit";
  return null;
}

function AgentPreview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Assigned deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Update the status of packages assigned to you. Each update is recorded on-chain.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your route</CardTitle>
          <CardDescription>{SAMPLE.filter((d) => d.agent !== ZERO).length} deliveries assigned to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE.filter((d) => d.agent !== ZERO).map((d) => {
                const label = nextStepLabel(d.status);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">#{d.id}</TableCell>
                    <TableCell className="max-w-xs truncate">{d.description}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{formatAddress(d.customer)}</TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-right">
                      {label ? (
                        <Button size="sm" type="button">
                          <Truck className="size-4" />
                          {label}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {d.status === DeliveryStatus.IN_TRANSIT ? "Awaiting customer" : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------- Customer ---------------------------- */
function CustomerPreview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">My deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Track each package&apos;s verified on-chain history and confirm receipt.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SAMPLE.map((d) => {
          const canConfirm = d.status === DeliveryStatus.IN_TRANSIT;
          return (
            <Card key={d.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Delivery #{d.id}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
                </div>
                <StatusBadge status={d.status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">Seller</dt>
                  <dd className="text-right font-mono">{formatAddress(d.seller)}</dd>
                  <dt className="text-muted-foreground">Agent</dt>
                  <dd className="text-right font-mono">{formatAddress(d.agent)}</dd>
                </dl>

                <div className="border-t border-border pt-4">
                  <DeliveryTimeline delivery={d} />
                </div>

                {d.status === DeliveryStatus.DELIVERED ? (
                  <p className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    Receipt confirmed on-chain.
                  </p>
                ) : (
                  <Button className="w-full" type="button" disabled={!canConfirm}>
                    <CheckCircle2 className="size-4" />
                    {canConfirm ? "Confirm receipt" : "Awaiting delivery"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { ErrorMessage, SuccessMessage } from "@/components/alert-message";
import { LoadingState, Spinner } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";
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
import { createDelivery, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatAddress, formatTimestamp } from "@/lib/status";
import { Role } from "@/lib/types";
import { useDeliveries } from "@/lib/use-deliveries";
import { sameAddress } from "@/lib/utils";

/** Matches a 0x-prefixed 40-hex-character Ethereum address. */
const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/** Seller screen: create deliveries and view the ones you created. */
export default function SellerDashboardPage() {
  return (
    <AuthGuard role={Role.SELLER}>
      <SellerDashboard />
    </AuthGuard>
  );
}

function SellerDashboard() {
  const { user } = useAuth();
  const { deliveries, loading, error, refetch } = useDeliveries();

  const [customer, setCustomer] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Only the deliveries this seller created.
  const myDeliveries = useMemo(
    () =>
      deliveries
        .filter((d) => sameAddress(d.seller, user?.ethereumAddress))
        .sort((a, b) => b.id - a.id),
    [deliveries, user?.ethereumAddress],
  );

  /** Validate then create a delivery, refreshing the list on success. */
  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!ETH_ADDRESS_RE.test(customer)) {
      setFormError("Enter a valid customer Ethereum address.");
      return;
    }
    if (description.trim().length === 0) {
      setFormError("A package description is required.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDelivery({
        customer,
        description: description.trim(),
      });
      setSuccess(`Delivery #${created.id} created and recorded on-chain.`);
      setCustomer("");
      setDescription("");
      await refetch();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Your deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Create delivery orders and follow their on-chain status.
        </p>
      </div>

      {/* Create delivery */}
      <Card>
        <CardHeader>
          <CardTitle>New delivery</CardTitle>
          <CardDescription>
            Record a new package on the ledger for a customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4" noValidate>
            {formError && <ErrorMessage message={formError} />}
            {success && <SuccessMessage message={success} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customer">Customer Ethereum address</Label>
                <Input
                  id="customer"
                  placeholder="0x…"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Package description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Electronics · 2.4kg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner /> : <Plus className="size-4" />}
              {submitting ? "Recording…" : "Create & record on ledger"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delivery list */}
      <Card>
        <CardHeader>
          <CardTitle>Created deliveries</CardTitle>
          <CardDescription>
            {myDeliveries.length} delivery{myDeliveries.length === 1 ? "" : "ies"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : myDeliveries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              You haven&apos;t created any deliveries yet.
            </p>
          ) : (
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
                {myDeliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">#{d.id}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {d.description}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatAddress(d.customer)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatAddress(d.agent)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(d.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

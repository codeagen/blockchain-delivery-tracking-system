"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { ErrorMessage } from "@/components/alert-message";
import { DeliveryTimeline } from "@/components/delivery-timeline";
import { LoadingState, Spinner } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { confirmDelivery, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatAddress } from "@/lib/status";
import { DeliveryStatus, Role } from "@/lib/types";
import { useDeliveries } from "@/lib/use-deliveries";
import { sameAddress } from "@/lib/utils";

/** Customer screen: track deliveries and confirm receipt. */
export default function CustomerTrackingPage() {
  return (
    <AuthGuard role={Role.CUSTOMER}>
      <CustomerTracking />
    </AuthGuard>
  );
}

function CustomerTracking() {
  const { user } = useAuth();
  const { deliveries, loading, error, refetch } = useDeliveries();

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  // Only deliveries addressed to this customer.
  const myDeliveries = useMemo(
    () =>
      deliveries
        .filter((d) => sameAddress(d.customer, user?.ethereumAddress))
        .sort((a, b) => b.id - a.id),
    [deliveries, user?.ethereumAddress],
  );

  /** Confirm receipt of a delivery, then refresh the list. */
  async function handleConfirm(id: number) {
    setRowError(null);
    setConfirmingId(id);
    try {
      await confirmDelivery(id);
      await refetch();
    } catch (err) {
      setRowError(getApiErrorMessage(err));
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">My deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Track each package&apos;s verified on-chain history and confirm
          receipt.
        </p>
      </div>

      {rowError && <ErrorMessage message={rowError} />}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : myDeliveries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You have no deliveries yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {myDeliveries.map((d) => {
            const canConfirm = d.status === DeliveryStatus.IN_TRANSIT;
            const isConfirming = confirmingId === d.id;
            return (
              <Card key={d.id}>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>Delivery #{d.id}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {d.description}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Seller</dt>
                    <dd className="text-right font-mono">
                      {formatAddress(d.seller)}
                    </dd>
                    <dt className="text-muted-foreground">Agent</dt>
                    <dd className="text-right font-mono">
                      {formatAddress(d.agent)}
                    </dd>
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
                    <Button
                      className="w-full"
                      disabled={!canConfirm || isConfirming}
                      onClick={() => handleConfirm(d.id)}
                    >
                      {isConfirming ? (
                        <Spinner />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      {canConfirm
                        ? "Confirm receipt"
                        : "Awaiting delivery"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

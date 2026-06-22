"use client";

import { useMemo, useState } from "react";
import { Truck } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { ErrorMessage } from "@/components/alert-message";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage, updateDeliveryStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatAddress } from "@/lib/status";
import { DeliveryStatus, Role } from "@/lib/types";
import { useDeliveries } from "@/lib/use-deliveries";
import { sameAddress } from "@/lib/utils";

/** Agent screen: see assigned deliveries and advance their status. */
export default function AgentDashboardPage() {
  return (
    <AuthGuard role={Role.AGENT}>
      <AgentDashboard />
    </AuthGuard>
  );
}

/** The next forward transition an agent can trigger for a given status. */
function nextStep(
  status: DeliveryStatus,
): { label: string; target: DeliveryStatus } | null {
  if (status === DeliveryStatus.ASSIGNED) {
    return { label: "Mark dispatched", target: DeliveryStatus.DISPATCHED };
  }
  if (status === DeliveryStatus.DISPATCHED) {
    return { label: "Mark in transit", target: DeliveryStatus.IN_TRANSIT };
  }
  return null;
}

function AgentDashboard() {
  const { user } = useAuth();
  const { deliveries, loading, error, refetch } = useDeliveries();

  // Id currently being updated, plus any per-row error.
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  // Only deliveries assigned to this agent.
  const myDeliveries = useMemo(
    () =>
      deliveries
        .filter((d) => sameAddress(d.agent, user?.ethereumAddress))
        .sort((a, b) => b.id - a.id),
    [deliveries, user?.ethereumAddress],
  );

  /** Advance a delivery to the given status, then refresh the list. */
  async function handleAdvance(id: number, target: DeliveryStatus) {
    setRowError(null);
    setUpdatingId(id);
    try {
      await updateDeliveryStatus(id, target);
      await refetch();
    } catch (err) {
      setRowError(getApiErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Assigned deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Update the status of packages assigned to you. Each update is recorded
          on-chain.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your route</CardTitle>
          <CardDescription>
            {myDeliveries.length} delivery{myDeliveries.length === 1 ? "" : "ies"}{" "}
            assigned to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rowError && <ErrorMessage message={rowError} />}

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : myDeliveries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No deliveries are assigned to you yet.
            </p>
          ) : (
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
                {myDeliveries.map((d) => {
                  const step = nextStep(d.status);
                  const isUpdating = updatingId === d.id;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">#{d.id}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {d.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatAddress(d.customer)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {step ? (
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleAdvance(d.id, step.target)}
                          >
                            {isUpdating ? (
                              <Spinner />
                            ) : (
                              <Truck className="size-4" />
                            )}
                            {step.label}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {d.status === DeliveryStatus.IN_TRANSIT
                              ? "Awaiting customer"
                              : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage, listDeliveries } from "./api";
import type { Delivery } from "./types";

/** Return shape of the {@link useDeliveries} hook. */
interface UseDeliveriesResult {
  deliveries: Delivery[];
  loading: boolean;
  error: string | null;
  /** Re-fetch the list (e.g. after a mutation). */
  refetch: () => Promise<void>;
}

/**
 * Fetches the full delivery list from the backend once on mount and exposes a
 * `refetch`. The backend returns every delivery; callers filter by role/address
 * (there is no server-side per-user filtering endpoint).
 */
export function useDeliveries(): UseDeliveriesResult {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual (re)fetch for event handlers — safe to set state synchronously here.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDeliveries(await listDeliveries());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load. State is only set after the await (never synchronously in the
  // effect body) and guarded by `active` so we don't update after unmount.
  useEffect(() => {
    let active = true;
    listDeliveries()
      .then((data) => {
        if (active) setDeliveries(data);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { deliveries, loading, error, refetch: load };
}

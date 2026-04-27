"use client";

import { useState, useEffect, useCallback } from "react";
import { Stats } from "@/types";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useNotification } from "@/context/NotificationContext";

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const { notifyError } = useNotification();

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await apiFetch(endpoints.stats);
        if (!res.ok) throw new Error("Failed to load stats");
        const data: Stats = await res.json();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
          notifyError("Could not load stats. The server may be starting up or unavailable.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [tick]);

  return { stats, loading, error, refetch };
}

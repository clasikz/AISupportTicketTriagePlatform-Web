"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/types";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useNotification } from "@/context/NotificationContext";

const SLOW_THRESHOLD_MS = 4000;

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifyError } = useNotification();

  useEffect(() => {
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setIsSlowLoad(true);
    }, SLOW_THRESHOLD_MS);

    apiFetch(endpoints.dashboard)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json() as Promise<DashboardStats>;
      })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error");
          notifyError("Could not load dashboard. The server may be starting up or unavailable.");
        }
      })
      .finally(() => {
        clearTimeout(slowTimer);
        if (!cancelled) { setIsSlowLoad(false); setLoading(false); }
      });

    return () => { cancelled = true; clearTimeout(slowTimer); };
  }, []);

  return { stats, loading, isSlowLoad, error };
}

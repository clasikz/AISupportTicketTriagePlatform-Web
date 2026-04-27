"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Ticket, PaginatedResponse, TicketFilters } from "@/types";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { buildTicketQuery, normalizeTicket, unwrapTicket } from "@/lib/utils";
import { useNotification } from "@/context/NotificationContext";

const SLOW_THRESHOLD_MS = 4000;

export function useTickets(filters: TicketFilters) {
  const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);
  const { notifyError } = useNotification();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let slowTimer: ReturnType<typeof setTimeout> | null = null;
    if (!hasLoadedOnce.current) {
      slowTimer = setTimeout(() => setIsSlowLoad(true), SLOW_THRESHOLD_MS);
    }

    try {
      const query = buildTicketQuery(filters);
      const res = await apiFetch(endpoints.tickets(query));
      if (!res.ok) throw new Error("Failed to load tickets");
      const json: PaginatedResponse<unknown> = await res.json();
      setData({ ...json, results: json.results.map((r) => normalizeTicket(unwrapTicket(r))) } as PaginatedResponse<Ticket>);
      hasLoadedOnce.current = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tickets";
      setError(msg);
      notifyError("Could not load tickets. The server may be starting up or unavailable.");
    } finally {
      if (slowTimer) clearTimeout(slowTimer);
      setIsSlowLoad(false);
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, isSlowLoad, error, refetch: fetch };
}

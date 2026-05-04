"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Ticket, Comment, Activity } from "@/types";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { normalizeTicket, unwrapTicket } from "@/lib/utils";

interface TicketDetail {
  ticket: Ticket;
  comments: Comment[];
  activities: Activity[];
}

export function useTicket(id: string) {
  const [data, setData] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const fetch = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    setError(null);
    try {
      const [ticketRes, commentsRes, activitiesRes] = await Promise.all([
        apiFetch(endpoints.ticket(id)),
        apiFetch(endpoints.comments(id)),
        apiFetch(endpoints.activities(id)),
      ]);

      if (!ticketRes.ok) throw new Error("Failed to load ticket");

      const [rawResponse, commentsJson, activitiesJson] = await Promise.all([
        ticketRes.json() as Promise<{ ticket: unknown; ai: unknown }>,
        commentsRes.ok ? commentsRes.json() : Promise.resolve({ results: [] }),
        activitiesRes.ok ? activitiesRes.json() : Promise.resolve({ results: [] }),
      ]);

      setData({
        ticket: normalizeTicket(unwrapTicket(rawResponse)),
        comments: Array.isArray(commentsJson) ? commentsJson : (commentsJson.results ?? []),
        activities: Array.isArray(activitiesJson) ? activitiesJson : (activitiesJson.results ?? []),
      });
      initialLoadDone.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

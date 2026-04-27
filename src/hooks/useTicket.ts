"use client";

import { useState, useEffect, useCallback } from "react";
import { Ticket, Comment, Activity, TicketAttachment } from "@/types";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { normalizeTicket, unwrapTicket } from "@/lib/utils";

interface TicketDetail {
  ticket: Ticket;
  comments: Comment[];
  activities: Activity[];
  attachments: TicketAttachment[];
}

export function useTicket(id: string) {
  const [data, setData] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketRes, commentsRes, activitiesRes] = await Promise.all([
        apiFetch(endpoints.ticket(id)),
        apiFetch(endpoints.comments(id)),
        apiFetch(endpoints.activities(id)),
      ]);

      if (!ticketRes.ok) throw new Error("Failed to load ticket");

      const [rawResponse, comments, activities] = await Promise.all([
        ticketRes.json() as Promise<{ ticket: unknown; ai: unknown; attachments?: TicketAttachment[] }>,
        commentsRes.ok ? (commentsRes.json() as Promise<Comment[]>) : Promise.resolve([]),
        activitiesRes.ok ? (activitiesRes.json() as Promise<Activity[]>) : Promise.resolve([]),
      ]);

      const attachments: TicketAttachment[] = rawResponse.attachments ?? [];

      setData({
        ticket: normalizeTicket(unwrapTicket(rawResponse)),
        comments,
        activities,
        attachments,
      });
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

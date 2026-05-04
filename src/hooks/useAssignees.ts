import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { HumanAssignee, AiAgent } from "@/types";

interface AssigneesData {
  humans: HumanAssignee[];
  aiAgents: AiAgent[];
}

export function useAssignees() {
  const [data, setData] = useState<AssigneesData>({ humans: [], aiAgents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(endpoints.assignees)
      .then((r) => r.json())
      .then((d: AssigneesData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { humans: data.humans, aiAgents: data.aiAgents, loading };
}

"use client";
import { useCallback, useEffect, useState } from "react";
import type { Plan } from "./plans";

interface Me {
  plan: Plan;
  planLabel: string;
  usedCredits: number;
  monthlyCredits: number;
  remaining: number;
  maxTokensPerRequest: number;
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) setMe(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { me, loading, refresh };
}
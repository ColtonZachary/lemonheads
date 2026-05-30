"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 5 * 60 * 1000;

function formatAgo(ms: number): string {
  const sec = Math.floor((Date.now() - ms) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min === 1) return "1 min ago";
  return `${min} min ago`;
}

export function ReportsAutoRefresh({
  intervalMs = REFRESH_MS,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const tick = () => {
      setRefreshing(true);
      router.refresh();
      setLastUpdated(Date.now());
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);

  useEffect(() => {
    if (!refreshing) return;
    const id = window.setTimeout(() => setRefreshing(false), 2500);
    return () => window.clearTimeout(id);
  }, [refreshing, lastUpdated]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs text-muted-foreground">
      {refreshing ? (
        "Refreshing…"
      ) : (
        <>
          Updated {formatAgo(lastUpdated)} · refreshes every 5 min
        </>
      )}
    </span>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Records a public site page view once per pathname per session. */
export function SitePageViewBeacon() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastSent.current) return;
    if (
      pathname.startsWith("/hub") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth")
    ) {
      return;
    }

    lastSent.current = pathname;

    void fetch("/api/site/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      lastSent.current = null;
    });
  }, [pathname]);

  return null;
}

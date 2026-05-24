"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Supabase sometimes redirects to Site URL with tokens in the hash (#access_token=…).
 * Server routes cannot read the hash — send to /auth/finish to complete sign-in.
 */
export function AuthHashHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || (!hash.includes("access_token") && !hash.includes("error="))) {
      return;
    }

    if (pathname.startsWith("/auth/finish")) return;

    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (!params.get("next")) {
      params.set(
        "next",
        type === "invite" || type === "recovery" ? "/auth/set-password" : "/rewards",
      );
    }

    const finish = `${window.location.origin}/auth/finish?${params.toString()}${hash}`;
    window.location.assign(finish);
  }, [pathname]);

  return null;
}

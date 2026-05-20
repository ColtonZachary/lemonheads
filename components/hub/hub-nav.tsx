"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { HubAccess } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const managerLinks = [
  { href: "/hub", label: "Dashboard" },
  { href: "/hub/calendar", label: "Calendar" },
  { href: "/hub/bookings", label: "Bookings" },
  { href: "/hub/customers", label: "Customers" },
  { href: "/hub/staff", label: "Staff" },
  { href: "/hub/promos", label: "Promo codes" },
  { href: "/hub/reports", label: "Reports" },
  { href: "/hub/settings", label: "Settings" },
] as const;

const detailerLinks = [{ href: "/hub/calendar", label: "My schedule" }] as const;

export function HubNav({ access }: { access: HubAccess }) {
  const pathname = usePathname();
  const links = access.isManager ? managerLinks : detailerLinks;

  return (
    <nav className="flex min-h-[100svh] flex-col gap-1 border-r border-white/10 bg-card px-3 py-6 min-w-[200px]">
      <div className="mb-6 px-2">
        <div className="font-display text-xl tracking-[0.08em] text-y">
          MANAGERS HUB
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text/40">
          {access.profile.full_name || access.profile.email}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-y/60">
          {access.profile.role} · Central Time
        </div>
      </div>

      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-[4px] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
            pathname === link.href || pathname.startsWith(`${link.href}/`)
              ? "bg-y/15 text-y"
              : "text-text/50 hover:bg-white/[0.04] hover:text-text",
          )}
        >
          {link.label}
        </Link>
      ))}

      {access.isAdmin && (
        <Link
          href="/hub/managers"
          className={cn(
            "mt-4 rounded-[4px] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors",
            pathname === "/hub/managers"
              ? "bg-y/15 text-y"
              : "text-text/50 hover:bg-white/[0.04] hover:text-text",
          )}
        >
          Managers
        </Link>
      )}

      <form action="/auth/signout" method="post" className="mt-auto px-2 pt-8">
        <button
          type="submit"
          className="w-full cursor-pointer rounded-[4px] border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text/50 transition-colors hover:border-y/25 hover:text-y"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}

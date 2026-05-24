import Link from "next/link";

import { requireHubAccess } from "@/lib/auth/require-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const settingsLinks = [
  {
    href: "/hub/settings/rules",
    title: "Rules",
    description: "Same-day cutoff and shop closed dates",
  },
  {
    href: "/hub/settings/coverage",
    title: "Service areas",
    description: "ZIP prefixes and cities for mobile bookings",
  },
  {
    href: "/hub/settings/pay-rates",
    title: "Pay rates",
    description: "Detailer pay per package and add-on (Regular vs Senior)",
  },
  {
    href: "/hub/settings/loyalty",
    title: "Loyalty",
    description: "Customer points, reward goals, and redemptions",
  },
  {
    href: "/hub/settings/appearance",
    title: "Hub colors",
    description: "Your personal hub theme",
  },
] as const;

export default async function HubSettingsPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ count: blackoutCount }, { count: coverageCount }] = await Promise.all([
    supabase!
      .from("blackout_dates")
      .select("*", { count: "exact", head: true })
      .gte("blackout_date", today),
    supabase!
      .from("service_area_coverage")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
  ]);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">SETTINGS</h1>
      <p className="mt-2 text-sm text-text/45">
        Scheduling rules, coverage, detailer pay, loyalty rewards, and your hub appearance.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Upcoming blackouts
          </p>
          <p className="font-display text-2xl text-y">{blackoutCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
            Coverage rules
          </p>
          <p className="font-display text-2xl text-y">{coverageCount ?? 0}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {settingsLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3 transition-colors hover:border-y/25 hover:bg-white/[0.02]"
            >
              <div>
                <span className="font-mono text-sm text-y/90">{item.title}</span>
                <p className="mt-0.5 text-xs text-text/45">{item.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-y/50">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

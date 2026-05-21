import Link from "next/link";

import { requireHubAccess } from "@/lib/auth/require-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubDashboardPage() {
  const access = await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);

  const { count: pendingCount } = await supabase!
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .is("deleted_at", null);

  const { count: todayCount } = await supabase!
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("appointment_date", today)
    .is("deleted_at", null);

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">DASHBOARD</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        All cities · America/Chicago
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Pending bookings" value={String(pendingCount ?? 0)} />
        <StatCard label="Jobs today (UTC date)" value={String(todayCount ?? 0)} />
        <StatCard label="Your role" value={access.profile.role} />
      </div>

      <div className="mt-12 rounded-md border border-y/15 bg-card p-6">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Quick links
        </h2>
        <ul className="mt-4 flex flex-col gap-2 font-mono text-sm text-y/80">
          <li>
            <Link href="/hub/calendar" className="hover:text-y">
              → Team calendar
            </Link>
          </li>
          <li>
            <Link href="/hub/blocks" className="hover:text-y">
              → Schedule blocks (PTO)
            </Link>
          </li>
          <li>
            <Link href="/hub/bookings" className="hover:text-y">
              → Manage bookings
            </Link>
          </li>
          <li>
            <Link href="/hub/bookings/new" className="hover:text-y">
              → Create booking
            </Link>
          </li>
          <li>
            <Link href="/hub/settings" className="hover:text-y">
              → Rules, blackouts, capacity
            </Link>
          </li>
        </ul>
        <p className="mt-6 font-mono text-[10px] leading-relaxed text-text/35">
          Full setup steps:{" "}
          <code className="text-y/60">docs/MANAGERS_HUB_SETUP.md</code>
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-card px-5 py-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-4xl tracking-[0.04em]">{value}</div>
    </div>
  );
}

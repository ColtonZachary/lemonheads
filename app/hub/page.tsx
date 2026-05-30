import Link from "next/link";

import { HubPageHeader, HubSection, HubStatCard } from "@/components/hub/hub-page";
import { Button } from "@/components/ui/button";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const quickLinks = [
  { href: "/hub/calendar", label: "Team calendar" },
  { href: "/hub/blocks", label: "Schedule blocks (PTO)" },
  { href: "/hub/settings/rules", label: "Rules & blackouts" },
  { href: "/hub/catalog", label: "Catalog (packages & add-ons)" },
  { href: "/hub/promos", label: "Promo codes" },
  { href: "/hub/staff", label: "Staff roster" },
] as const;

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
    <div className="flex flex-col gap-10">
      <HubPageHeader
        title="Dashboard"
        description="All cities · America/Chicago"
      >
        <Button asChild>
          <Link href="/hub/calendar">Open calendar</Link>
        </Button>
      </HubPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubStatCard label="Pending bookings" value={pendingCount ?? 0} />
        <HubStatCard label="Jobs today (UTC date)" value={todayCount ?? 0} />
        <HubStatCard label="Your role" value={access.profile.role} />
      </div>

      <HubSection title="Quick links">
        <ul className="flex flex-col gap-2">
          {quickLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-mono text-sm text-primary hover:underline"
              >
                → {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 font-mono text-[10px] leading-relaxed text-muted-foreground">
          Full setup steps:{" "}
          <code className="text-primary/80">docs/MANAGERS_HUB_SETUP.md</code>
        </p>
      </HubSection>
    </div>
  );
}

import {
  HubPageHeader,
  HubSettingsLinkCard,
  HubStatCard,
} from "@/components/hub/hub-page";
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
    href: "/hub/settings/checklist",
    title: "Detail checklist",
    description: "Items detailers confirm after each job in the app",
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
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <HubPageHeader
        title="Settings"
        description="Scheduling rules, coverage, detailer pay, loyalty rewards, and your hub appearance."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <HubStatCard label="Upcoming blackouts" value={blackoutCount ?? 0} />
        <HubStatCard label="Coverage rules" value={coverageCount ?? 0} />
      </div>

      <div className="flex flex-col gap-2">
        {settingsLinks.map((item) => (
          <HubSettingsLinkCard key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}

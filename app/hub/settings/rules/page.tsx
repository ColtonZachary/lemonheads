import Link from "next/link";

import { BlackoutDatesPanel, type BlackoutRow } from "@/components/hub/blackout-dates-panel";
import {
  LeadTimeRuleForm,
  type LeadTimeRuleRow,
} from "@/components/hub/lead-time-rule-form";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubSettingsRulesPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: rules }, { data: blackouts }, { data: areas }] = await Promise.all([
    supabase!.from("lead_time_rules").select("rule_key, label, active, config").order("rule_key"),
    supabase!
      .from("blackout_dates")
      .select("id, blackout_date, reason, service_area_slug, service_areas(city)")
      .gte("blackout_date", today)
      .order("blackout_date", { ascending: true }),
    supabase!
      .from("service_areas")
      .select("slug, city")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const blackoutRows: BlackoutRow[] = (blackouts ?? []).map((b) => ({
    id: b.id,
    blackout_date: b.blackout_date,
    reason: b.reason,
    service_area_slug: b.service_area_slug,
    service_areas: Array.isArray(b.service_areas)
      ? (b.service_areas[0] ?? null)
      : b.service_areas,
  }));

  const sameDayRule = (rules ?? []).find((r) => r.rule_key === "same_day_cutoff");

  return (
    <div>
      <Link
        href="/hub/settings"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Settings
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">RULES</h1>
      <p className="mt-2 font-mono text-xs tracking-[0.08em] text-text/40">
        Step 3 of hub setup · lead time and shop closed dates
      </p>

      <div className="mt-10 max-w-2xl space-y-12">
        {sameDayRule ? (
          <LeadTimeRuleForm rule={sameDayRule as LeadTimeRuleRow} />
        ) : (
          <p className="rounded-md border border-red-500/20 p-4 font-mono text-xs text-red-200">
            Missing <code>same_day_cutoff</code> rule — run the managers hub migration in
            Supabase.
          </p>
        )}

        <BlackoutDatesPanel
          blackouts={blackoutRows}
          serviceAreas={areas ?? []}
        />
      </div>
    </div>
  );
}

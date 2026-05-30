import Link from "next/link";

import { HubPageHeader } from "@/components/hub/hub-page";
import {
  ServiceAreaCoveragePanel,
  type CoverageRuleRow,
} from "@/components/hub/service-area-coverage-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubSettingsCoveragePage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const [{ data: areas }, { data: coverage }] = await Promise.all([
    supabase!
      .from("service_areas")
      .select("slug, city, state, travel_minutes_from_shop")
      .eq("active", true)
      .order("sort_order"),
    supabase!
      .from("service_area_coverage")
      .select("id, service_area_slug, zip_prefix, city_name, active")
      .eq("active", true)
      .order("service_area_slug"),
  ]);

  const rules: CoverageRuleRow[] = (coverage ?? []).map((r) => ({
    id: r.id,
    service_area_slug: r.service_area_slug,
    zip_prefix: r.zip_prefix,
    city_name: r.city_name,
    active: r.active,
  }));

  return (
    <div>
      <Link
        href="/hub/settings"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        ← Settings
      </Link>

      <div className="mt-4">
        <HubPageHeader
          title="Service areas"
          description="ZIP and city rules for mobile detailing — separate from team schedule limits."
        />
      </div>

      <div className="mt-6 max-w-4xl">
        <ServiceAreaCoveragePanel
          serviceAreas={(areas ?? []).map((a) => ({
            slug: a.slug,
            city: a.city,
            state: a.state,
            travelMinutesFromShop: a.travel_minutes_from_shop ?? 0,
          }))}
          rules={rules}
        />
      </div>
    </div>
  );
}

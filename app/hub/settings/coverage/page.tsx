import Link from "next/link";

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
      .select("slug, city, state")
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
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Settings
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">
        SERVICE AREAS
      </h1>
      <p className="mt-2 text-sm text-text/45">
        ZIP and city rules for mobile detailing — separate from team schedule limits.
      </p>

      <div className="mt-6 max-w-4xl">
        <ServiceAreaCoveragePanel
          serviceAreas={areas ?? []}
          rules={rules}
        />
      </div>
    </div>
  );
}

import { StaffPanel } from "@/components/hub/staff-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchStaffMembers } from "@/lib/bookings/bookable-detailers";
import { fetchBlockedPackageKeysForStaff } from "@/lib/bookings/staff-package-blocks";
import { fetchAllowedServiceAreaSlugsForStaff } from "@/lib/bookings/staff-service-areas";
import { fetchPublicCatalog } from "@/lib/catalog/public-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubStaffPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const [staff, catalog, { data: areaRows }] = await Promise.all([
    fetchStaffMembers(supabase!),
    fetchPublicCatalog(supabase),
    supabase!
      .from("service_areas")
      .select("slug, city, state")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const serviceAreas = (areaRows ?? []).map((row) => ({
    slug: row.slug as string,
    label: `${row.city as string}, ${row.state as string}`,
  }));

  const detailers = staff.filter((s) => s.is_detailer);
  const [blockedEntries, allowedEntries] = await Promise.all([
    Promise.all(
      detailers.map(async (member) => [
        member.id,
        await fetchBlockedPackageKeysForStaff(supabase!, member.id),
      ] as const),
    ),
    Promise.all(
      detailers.map(async (member) => [
        member.id,
        await fetchAllowedServiceAreaSlugsForStaff(supabase!, member.id),
      ] as const),
    ),
  ]);
  const blockedByStaffId = Object.fromEntries(blockedEntries);
  const allowedAreasByStaffId = Object.fromEntries(allowedEntries);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">STAFF</h1>
      <p className="mt-2 text-sm text-text/45">
        Website team page and booking roster — edit one person at a time; deactivate or
        delete from the row actions.
      </p>

      <div className="mt-6">
        <StaffPanel
          staff={staff}
          packages={catalog.packages}
          serviceAreas={serviceAreas}
          blockedByStaffId={blockedByStaffId}
          allowedAreasByStaffId={allowedAreasByStaffId}
        />
      </div>
    </div>
  );
}

import { StaffPanel } from "@/components/hub/staff-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchStaffMembers } from "@/lib/bookings/bookable-detailers";
import { fetchBlockedPackageKeysForStaff } from "@/lib/bookings/staff-package-blocks";
import { fetchPublicCatalog } from "@/lib/catalog/public-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubStaffPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const [staff, catalog] = await Promise.all([
    fetchStaffMembers(supabase!),
    fetchPublicCatalog(supabase),
  ]);

  const detailers = staff.filter((s) => s.is_detailer);
  const blockedEntries = await Promise.all(
    detailers.map(async (member) => [
      member.id,
      await fetchBlockedPackageKeysForStaff(supabase!, member.id),
    ] as const),
  );
  const blockedByStaffId = Object.fromEntries(blockedEntries);

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
          blockedByStaffId={blockedByStaffId}
        />
      </div>
    </div>
  );
}

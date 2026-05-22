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
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">STAFF</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Team roster for the website and booking assignment. Deactivate to hide someone,
        or remove permanently to delete their record, photo, and schedule rules (past
        bookings keep their name).
      </p>

      <div className="mt-10 max-w-2xl">
        <StaffPanel
          staff={staff}
          packages={catalog.packages}
          blockedByStaffId={blockedByStaffId}
        />
      </div>
    </div>
  );
}

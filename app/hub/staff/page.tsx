import { StaffPanel } from "@/components/hub/staff-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchStaffMembers } from "@/lib/bookings/bookable-detailers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubStaffPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const staff = await fetchStaffMembers(supabase!);

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">STAFF</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Team roster for the website and booking assignment. Deactivate to hide someone,
        or remove permanently to delete their record, photo, and schedule rules (past
        bookings keep their name).
      </p>

      <div className="mt-10 max-w-2xl">
        <StaffPanel staff={staff} />
      </div>
    </div>
  );
}

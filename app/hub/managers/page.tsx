import { ManagersPanel, type HubProfileRow } from "@/components/hub/managers-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HubManagersPage() {
  const access = await requireHubAccess();
  if (!access.isAdmin) redirect("/hub");

  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase!
    .from("profiles")
    .select("id, role, full_name, email, phone, active")
    .order("role")
    .order("full_name");

  const rows: HubProfileRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    role: p.role,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    active: p.active,
  }));

  return (
    <div>
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">HUB ACCESS</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Invite managers and admins, set roles, or deactivate sign-in without deleting
        their Supabase account.
      </p>

      <div className="mt-10 max-w-2xl">
        <ManagersPanel profiles={rows} currentUserId={access.profile.id} />
      </div>
    </div>
  );
}

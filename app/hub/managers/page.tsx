import { ManagersPanel, type HubProfileRow } from "@/components/hub/managers-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubManagersPage() {
  const access = await requireHubAccess({ managerOnly: true });
  if (access.profile.role !== "admin" && access.profile.role !== "manager") {
    redirect("/hub/calendar");
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase!.from("profiles").select("id, role, full_name, email, phone, active");

  if (!access.isAdmin) {
    query = query.eq("role", "detailer");
  }

  const { data: profiles } = await query.order("role").order("full_name");

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
        {access.isAdmin
          ? "Invite hub users, change roles, or remove access for admins, managers, and detailers."
          : "Manage detailer sign-in — remove access when someone should no longer use the hub."}
      </p>

      <div className="mt-10 max-w-2xl">
        <ManagersPanel
          profiles={rows}
          currentUserId={access.profile.id}
          viewerRole={access.profile.role}
        />
      </div>
    </div>
  );
}

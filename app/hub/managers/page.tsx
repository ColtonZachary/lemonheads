import { ManagersPanel, type HubProfileRow } from "@/components/hub/managers-panel";
import { HubPageHeader } from "@/components/hub/hub-page";
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
    query = query.in("role", ["manager", "detailer"]);
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
      <HubPageHeader
        title="Hub access"
        description={
          access.isAdmin
            ? "Invite users, edit one account at a time, remove access, or delete to free an email."
            : "Invite managers and detailers — edit one row at a time. Admin accounts are admin-only."
        }
      />

      <div className="mt-6 max-w-4xl">
        <ManagersPanel
          profiles={rows}
          currentUserId={access.profile.id}
          viewerRole={access.profile.role}
        />
      </div>
    </div>
  );
}

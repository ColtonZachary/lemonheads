import { HubComingSoon } from "@/components/hub/coming-soon";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { redirect } from "next/navigation";

export default async function HubManagersPage() {
  const access = await requireHubAccess();
  if (!access.isAdmin) redirect("/hub");

  return (
    <HubComingSoon
      title="MANAGERS"
      items={[
        "Add / remove manager accounts",
        "Change roles (admin, manager, detailer)",
        "Deactivate access without deleting Auth user",
      ]}
    />
  );
}

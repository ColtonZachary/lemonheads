import { HubComingSoon } from "@/components/hub/coming-soon";
import { requireHubAccess } from "@/lib/auth/require-hub";

export default async function HubStaffPage() {
  await requireHubAccess({ managerOnly: true });
  return (
    <HubComingSoon
      title="STAFF"
      items={[
        "Add / remove / deactivate detailers",
        "Toggle bookable on website",
        "Link staff to login (detailer view-only)",
      ]}
    />
  );
}

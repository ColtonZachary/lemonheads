import { HubComingSoon } from "@/components/hub/coming-soon";
import { requireHubAccess } from "@/lib/auth/require-hub";

export default async function HubSettingsPage() {
  await requireHubAccess({ managerOnly: true });
  return (
    <HubComingSoon
      title="SETTINGS"
      items={[
        "Blackout dates (shop closed)",
        "Lead time rules (e.g. no same-day after 4 PM)",
        "Capacity per city",
        "Service-area zip / city validation",
        "Packages, add-ons, location types",
        "Notification preferences (email / SMS queue)",
      ]}
    />
  );
}

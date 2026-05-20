import { HubComingSoon } from "@/components/hub/coming-soon";
import { requireHubAccess } from "@/lib/auth/require-hub";

export default async function HubReportsPage() {
  await requireHubAccess({ managerOnly: true });
  return (
    <HubComingSoon
      title="REPORTS"
      items={[
        "Revenue by package and add-on",
        "Detailer utilization",
        "Bookings by city / service area",
      ]}
    />
  );
}

import { HubComingSoon } from "@/components/hub/coming-soon";
import { requireHubAccess } from "@/lib/auth/require-hub";

export default async function HubCustomersPage() {
  await requireHubAccess({ managerOnly: true });
  return (
    <HubComingSoon
      title="CUSTOMERS"
      items={[
        "Search by email or phone",
        "Booking history and repeat customer stats",
        "Quick link to past jobs",
      ]}
    />
  );
}

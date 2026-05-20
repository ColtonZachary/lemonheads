import { HubComingSoon } from "@/components/hub/coming-soon";
import { requireHubAccess } from "@/lib/auth/require-hub";

export default async function HubPromosPage() {
  await requireHubAccess({ managerOnly: true });
  return (
    <HubComingSoon
      title="PROMO CODES"
      items={[
        "Create percent or fixed discounts",
        "Usage limits and expiry dates",
        "Apply at checkout on public booking flow",
      ]}
    />
  );
}

import { PromoCodesPanel } from "@/components/hub/promo-codes-panel";
import { HubPageHeader } from "@/components/hub/hub-page";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchCatalogPackages } from "@/lib/hub/catalog-db";
import { fetchPromoCodes } from "@/lib/hub/promo-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubPromosPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const [promos, packages] = await Promise.all([
    fetchPromoCodes(supabase!),
    fetchCatalogPackages(supabase!),
  ]);

  const packageOptions = packages
    .filter((p) => p.active)
    .map((p) => ({ key: p.key, name: p.name }));

  return (
    <div>
      <HubPageHeader
        title="Promo codes"
        description="Percent or fixed discounts with limits, date ranges, and package rules. Applied on the public booking page."
      />

      <div className="mt-10 max-w-2xl">
        <PromoCodesPanel promos={promos} packageOptions={packageOptions} />
      </div>
    </div>
  );
}

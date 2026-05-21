import { PromoCodesPanel } from "@/components/hub/promo-codes-panel";
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
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">PROMO CODES</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Create percent or fixed discounts with optional usage limits, date ranges, and
        package restrictions. Customers apply codes on the public booking page.
      </p>

      <div className="mt-10 max-w-2xl">
        <PromoCodesPanel promos={promos} packageOptions={packageOptions} />
      </div>
    </div>
  );
}

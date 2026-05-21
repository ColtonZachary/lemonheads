import Link from "next/link";

import { CatalogAddonsPanel } from "@/components/hub/catalog-addons-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchCatalogAddons } from "@/lib/hub/catalog-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubCatalogAddonsPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const addons = await fetchCatalogAddons(supabase!);

  return (
    <div>
      <Link
        href="/hub/catalog"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Catalog
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">ADD-ONS</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Optional services customers can add when booking. Icon names match the site icon set.
      </p>

      <div className="mt-10 max-w-2xl">
        <CatalogAddonsPanel addons={addons} />
      </div>
    </div>
  );
}

import Link from "next/link";

import { HubPageHeader } from "@/components/hub/hub-page";
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
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        ← Catalog
      </Link>

      <div className="mt-4">
        <HubPageHeader
          title="Add-ons"
          description="Optional extras on the booking flow — tap Edit on a row to change pricing or copy."
        />
      </div>

      <div className="mt-6 max-w-4xl">
        <CatalogAddonsPanel addons={addons} />
      </div>
    </div>
  );
}

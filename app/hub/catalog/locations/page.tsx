import Link from "next/link";

import { HubPageHeader } from "@/components/hub/hub-page";
import { CatalogLocationsPanel } from "@/components/hub/catalog-locations-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchBookingLocationTypes } from "@/lib/hub/catalog-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubCatalogLocationsPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const locations = await fetchBookingLocationTypes(supabase!);

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
          title="Location types"
          description="Where customers can have their vehicle detailed — compact list, edit one at a time."
        />
      </div>

      <div className="mt-6 max-w-4xl">
        <CatalogLocationsPanel locations={locations} />
      </div>
    </div>
  );
}

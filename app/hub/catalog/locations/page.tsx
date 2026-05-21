import Link from "next/link";

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
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Catalog
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">LOCATION TYPES</h1>
      <p className="mt-2 max-w-2xl text-sm text-text/45">
        Choices shown on the booking form for where the vehicle will be (e.g. driveway,
        apartment garage).
      </p>

      <div className="mt-10 max-w-2xl">
        <CatalogLocationsPanel locations={locations} />
      </div>
    </div>
  );
}

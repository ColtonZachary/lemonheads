import Link from "next/link";

import { CatalogPackagesPanel } from "@/components/hub/catalog-packages-panel";
import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchCatalogPackages } from "@/lib/hub/catalog-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HubCatalogPackagesPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();
  const packages = await fetchCatalogPackages(supabase!);

  return (
    <div>
      <Link
        href="/hub/catalog"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40 hover:text-y"
      >
        ← Catalog
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-[0.04em] text-y">PACKAGES</h1>
      <p className="mt-2 text-sm text-text/45">
        Site and booking services — edit one package at a time; deactivate instead of delete
        when bookings reference a package.
      </p>

      <div className="mt-6 max-w-4xl">
        <CatalogPackagesPanel packages={packages} />
      </div>
    </div>
  );
}

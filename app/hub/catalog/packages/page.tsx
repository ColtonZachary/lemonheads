import Link from "next/link";

import { HubPageHeader } from "@/components/hub/hub-page";
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
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        ← Catalog
      </Link>

      <div className="mt-4">
        <HubPageHeader
          title="Packages"
          description="Site and booking services — edit one package at a time; deactivate instead of delete when bookings reference a package."
        />
      </div>

      <div className="mt-6 max-w-4xl">
        <CatalogPackagesPanel packages={packages} />
      </div>
    </div>
  );
}

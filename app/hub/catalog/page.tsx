import {
  HubPageHeader,
  HubSettingsLinkCard,
  HubStatCard,
} from "@/components/hub/hub-page";
import { requireHubAccess } from "@/lib/auth/require-hub";
import {
  fetchCatalogAddons,
  fetchCatalogPackages,
  fetchBookingLocationTypes,
} from "@/lib/hub/catalog-db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const catalogLinks = [
  {
    href: "/hub/catalog/packages",
    title: "Packages",
    description: "Services, vehicle pricing, duration",
  },
  {
    href: "/hub/catalog/addons",
    title: "Add-ons",
    description: "Optional booking extras",
  },
  {
    href: "/hub/catalog/locations",
    title: "Location types",
    description: "Where we can perform the detail",
  },
] as const;

export default async function HubCatalogPage() {
  await requireHubAccess({ managerOnly: true });
  const supabase = await createSupabaseServerClient();

  const [packages, addons, locations] = await Promise.all([
    fetchCatalogPackages(supabase!),
    fetchCatalogAddons(supabase!),
    fetchBookingLocationTypes(supabase!),
  ]);

  const activePackages = packages.filter((p) => p.active).length;
  const activeAddons = addons.filter((a) => a.active).length;
  const activeLocations = locations.filter((l) => l.active).length;

  return (
    <div className="max-w-4xl">
      <HubPageHeader
        title="Catalog"
        description="Packages, add-ons, and location types for the website and hub bookings."
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <HubStatCard label="Packages" value={activePackages} />
        <HubStatCard label="Add-ons" value={activeAddons} />
        <HubStatCard label="Locations" value={activeLocations} />
      </div>

      <ul className="mt-6 space-y-2">
        {catalogLinks.map((item) => (
          <li key={item.href}>
            <HubSettingsLinkCard
              href={item.href}
              title={item.title}
              description={item.description}
            />
          </li>
        ))}
      </ul>

      <p className="mt-6 font-mono text-[10px] text-muted-foreground">
        Empty tables? Run{" "}
        <code className="text-primary">npm run hub:seed</code> once.
      </p>
    </div>
  );
}

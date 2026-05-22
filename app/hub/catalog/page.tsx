import Link from "next/link";

import { requireHubAccess } from "@/lib/auth/require-hub";
import { fetchCatalogAddons, fetchCatalogPackages, fetchBookingLocationTypes } from "@/lib/hub/catalog-db";
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
      <h1 className="font-display text-5xl tracking-[0.04em] text-y">CATALOG</h1>
      <p className="mt-2 text-sm text-text/45">
        Packages, add-ons, and location types for the website and hub bookings.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Packages</p>
          <p className="font-display text-2xl text-y">{activePackages}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Add-ons</p>
          <p className="font-display text-2xl text-y">{activeAddons}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">Locations</p>
          <p className="font-display text-2xl text-y">{activeLocations}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {catalogLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3 transition-colors hover:border-y/25 hover:bg-white/[0.02]"
            >
              <div>
                <span className="font-mono text-sm text-y/90">{item.title}</span>
                <p className="mt-0.5 text-xs text-text/45">{item.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-y/50">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 font-mono text-[10px] text-text/35">
        Empty tables? Run <code className="text-y/60">npm run hub:seed</code> once.
      </p>
    </div>
  );
}

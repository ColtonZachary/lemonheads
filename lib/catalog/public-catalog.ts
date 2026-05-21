import type { SupabaseClient } from "@supabase/supabase-js";

import type { IconName } from "@/components/ui/icons";
import {
  ADDONS,
  PACKAGES,
  VEHICLE_OPTIONS,
  type AddOn,
  type VehicleKey,
} from "@/lib/data";
import { isAddonIcon } from "@/lib/hub/catalog-icons";
import {
  fetchBookingLocationTypes,
  fetchCatalogAddons,
  fetchCatalogPackages,
  type CatalogAddonRow,
  type CatalogPackageRow,
} from "@/lib/hub/catalog-db";

/** Package shape used on the public site and booking flow (dynamic keys from DB). */
export type SitePackage = {
  key: string;
  name: string;
  prices: Record<VehicleKey, number>;
  durationHours: number;
  description: string;
  features: string[];
  featured?: boolean;
};

export type PublicCatalog = {
  packages: SitePackage[];
  addons: AddOn[];
  locationTypes: string[];
};

const DEFAULT_LOCATION_TYPES = [
  "Come to my home",
  "Come to my office / workplace",
  "Drop off at your Edmond location",
];

const PACKAGE_ICONS: Record<string, IconName> = {
  basic: "document",
  quickie: "bolt",
  toughy: "wrench",
  fully: "star",
  boujee: "diamond",
  interior: "couch",
};

export function packageIconForKey(key: string): IconName {
  return PACKAGE_ICONS[key] ?? "star";
}

export function packagesByKey(
  packages: SitePackage[],
): Record<string, SitePackage> {
  return Object.fromEntries(packages.map((p) => [p.key, p]));
}

function rowToSitePackage(row: CatalogPackageRow): SitePackage {
  const prices = {} as Record<VehicleKey, number>;
  for (const v of VEHICLE_OPTIONS) {
    prices[v.key] = (row.prices[v.key] ?? 0) / 100;
  }
  return {
    key: row.key,
    name: row.name,
    prices,
    durationHours: Number(row.duration_hours),
    description: row.description,
    features: row.features,
    featured: row.featured || undefined,
  };
}

function rowToAddon(row: CatalogAddonRow): AddOn {
  return {
    name: row.name,
    price: row.price_cents / 100,
    description: row.description,
    priceSuffix: row.price_suffix || undefined,
    icon: isAddonIcon(row.icon) ? row.icon : "spray",
  };
}

/** Static fallback when Supabase is unavailable or catalog tables are empty. */
export function staticPublicCatalog(): PublicCatalog {
  return {
    packages: PACKAGES.map((p) => ({
      key: p.key,
      name: p.name,
      prices: p.prices,
      durationHours: p.durationHours,
      description: p.description,
      features: p.features,
      featured: p.featured,
    })),
    addons: ADDONS,
    locationTypes: DEFAULT_LOCATION_TYPES,
  };
}

export async function fetchPublicCatalog(
  client: SupabaseClient | null,
): Promise<PublicCatalog> {
  if (!client) return staticPublicCatalog();

  const [packageRows, addonRows, locationRows] = await Promise.all([
    fetchCatalogPackages(client),
    fetchCatalogAddons(client),
    fetchBookingLocationTypes(client),
  ]);

  const activePackages = packageRows.filter((p) => p.active);
  const activeAddons = addonRows.filter((a) => a.active);
  const activeLocations = locationRows
    .filter((l) => l.active)
    .map((l) => l.label);

  if (!activePackages.length) {
    return {
      ...staticPublicCatalog(),
      addons: activeAddons.length
        ? activeAddons.map(rowToAddon)
        : staticPublicCatalog().addons,
      locationTypes: activeLocations.length
        ? activeLocations
        : DEFAULT_LOCATION_TYPES,
    };
  }

  return {
    packages: activePackages.map(rowToSitePackage),
    addons: activeAddons.length
      ? activeAddons.map(rowToAddon)
      : staticPublicCatalog().addons,
    locationTypes: activeLocations.length
      ? activeLocations
      : DEFAULT_LOCATION_TYPES,
  };
}

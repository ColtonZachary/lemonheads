import type { SupabaseClient } from "@supabase/supabase-js";

import { VEHICLE_OPTIONS } from "@/lib/data";

export type CatalogPackageRow = {
  key: string;
  name: string;
  description: string;
  features: string[];
  duration_hours: number;
  featured: boolean;
  active: boolean;
  sort_order: number;
  prices: Record<string, number>;
};

export type CatalogAddonRow = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  price_suffix: string;
  icon: string;
  active: boolean;
  sort_order: number;
};

export type BookingLocationTypeRow = {
  id: string;
  label: string;
  active: boolean;
  sort_order: number;
};

export async function fetchCatalogPackages(
  client: SupabaseClient,
): Promise<CatalogPackageRow[]> {
  const [{ data: packages }, { data: prices }] = await Promise.all([
    client.from("catalog_packages").select("*").order("sort_order"),
    client.from("catalog_package_prices").select("package_key, vehicle_key, price_cents"),
  ]);

  const priceMap = new Map<string, Record<string, number>>();
  for (const p of prices ?? []) {
    const row = priceMap.get(p.package_key) ?? {};
    row[p.vehicle_key] = p.price_cents;
    priceMap.set(p.package_key, row);
  }

  return (packages ?? []).map((pkg) => ({
    key: pkg.key,
    name: pkg.name,
    description: pkg.description,
    features: Array.isArray(pkg.features) ? (pkg.features as string[]) : [],
    duration_hours: Number(pkg.duration_hours),
    featured: pkg.featured,
    active: pkg.active,
    sort_order: pkg.sort_order,
    prices: priceMap.get(pkg.key) ?? {},
  }));
}

export async function fetchCatalogAddons(
  client: SupabaseClient,
): Promise<CatalogAddonRow[]> {
  const { data, error } = await client
    .from("catalog_addons")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) {
    console.error("[catalog] addons:", error.message);
    return [];
  }

  return (data ?? []) as CatalogAddonRow[];
}

export async function fetchBookingLocationTypes(
  client: SupabaseClient,
): Promise<BookingLocationTypeRow[]> {
  const { data, error } = await client
    .from("booking_location_types")
    .select("*")
    .order("sort_order")
    .order("label");

  if (error) {
    console.error("[catalog] locations:", error.message);
    return [];
  }

  return (data ?? []) as BookingLocationTypeRow[];
}

export function vehicleKeysForCatalog(): string[] {
  return VEHICLE_OPTIONS.map((v) => v.key);
}

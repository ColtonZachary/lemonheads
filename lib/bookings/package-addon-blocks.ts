import type { SupabaseClient } from "@supabase/supabase-js";

import { ADDONS } from "@/lib/data";

export type AddonCategory = "interior" | "exterior" | "general";

/** package key → add-on names blocked for that package */
export type PackageAddonBlocksMap = Record<string, string[]>;

export const INTERIOR_ADDON_NAMES = [
  "Shampoo",
  "Steam Clean",
  "Pet Hair Removal",
  "Ozone Air Treatment",
] as const;

export const EXTERIOR_ADDON_NAMES = [
  "Clay Bar",
  "Headlight Restoration",
  "Engine Bay Clean",
  "Ceramic Spray",
] as const;

export const DEFAULT_PACKAGE_ADDON_BLOCKS: PackageAddonBlocksMap = {
  quickie: [...INTERIOR_ADDON_NAMES],
  toughy: [...INTERIOR_ADDON_NAMES],
  interior: [...EXTERIOR_ADDON_NAMES],
  boujee: ADDONS.map((addon) => addon.name),
};

export function getBlockedAddonNamesForPackage(
  blocks: PackageAddonBlocksMap,
  packageKey: string,
): string[] {
  const key = packageKey.trim();
  if (!key) return [];
  if (Object.prototype.hasOwnProperty.call(blocks, key)) {
    return blocks[key] ?? [];
  }
  return DEFAULT_PACKAGE_ADDON_BLOCKS[key] ?? [];
}

export function isAddonBlockedForPackage(
  blocks: PackageAddonBlocksMap,
  packageKey: string,
  addonName: string,
): boolean {
  const key = packageKey.trim();
  const name = addonName.trim();
  if (!key || !name) return false;
  return getBlockedAddonNamesForPackage(blocks, key).includes(name);
}

export function filterAllowedAddonNames(
  packageKey: string,
  addonNames: string[],
  blocks: PackageAddonBlocksMap,
): string[] {
  return addonNames.filter(
    (name) => !isAddonBlockedForPackage(blocks, packageKey, name),
  );
}

export function validatePackageAddonSelection(
  packageKey: string,
  addonNames: string[],
  blocks: PackageAddonBlocksMap,
): { ok: true } | { ok: false; message: string } {
  const key = packageKey.trim();
  if (!key) return { ok: true };

  const invalid = addonNames.filter((name) =>
    isAddonBlockedForPackage(blocks, key, name),
  );
  if (!invalid.length) return { ok: true };

  return {
    ok: false,
    message: `These add-ons are not available with the selected package: ${invalid.join(", ")}.`,
  };
}

export async function fetchPackageAddonBlocksMap(
  client: SupabaseClient,
): Promise<PackageAddonBlocksMap> {
  const { data, error } = await client
    .from("package_addon_blocks")
    .select("package_key, addon_name");

  if (error) {
    console.error("[catalog] package addon blocks:", error.message);
    return {};
  }

  const map: PackageAddonBlocksMap = {};
  for (const row of data ?? []) {
    const pkgKey = row.package_key as string;
    const list = map[pkgKey] ?? [];
    list.push(row.addon_name as string);
    map[pkgKey] = list;
  }
  return map;
}

export async function fetchBlockedAddonNamesForPackageKey(
  client: SupabaseClient,
  packageKey: string,
): Promise<string[]> {
  const map = await fetchPackageAddonBlocksMap(client);
  return getBlockedAddonNamesForPackage(map, packageKey);
}

export async function syncPackageAddonBlocks(
  client: SupabaseClient,
  packageKey: string,
  blockedAddonNames: string[],
  allowedAddonNames: ReadonlySet<string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = [
    ...new Set(
      blockedAddonNames
        .map((name) => name.trim())
        .filter((name) => name && allowedAddonNames.has(name)),
    ),
  ];

  const { error: deleteError } = await client
    .from("package_addon_blocks")
    .delete()
    .eq("package_key", packageKey);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  if (!normalized.length) return { ok: true };

  const { error: insertError } = await client.from("package_addon_blocks").insert(
    normalized.map((addon_name) => ({
      package_key: packageKey,
      addon_name,
    })),
  );

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}

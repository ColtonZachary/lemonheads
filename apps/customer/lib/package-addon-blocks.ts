export type PackageAddonBlocksMap = Record<string, string[]>;

const INTERIOR_ADDON_NAMES = [
  "Shampoo",
  "Steam Clean",
  "Pet Hair Removal",
  "Ozone Air Treatment",
];

const EXTERIOR_ADDON_NAMES = [
  "Clay Bar",
  "Headlight Restoration",
  "Engine Bay Clean",
  "Ceramic Spray",
];

const DEFAULT_PACKAGE_ADDON_BLOCKS: PackageAddonBlocksMap = {
  quickie: INTERIOR_ADDON_NAMES,
  toughy: INTERIOR_ADDON_NAMES,
  interior: EXTERIOR_ADDON_NAMES,
  boujee: [
    ...INTERIOR_ADDON_NAMES,
    ...EXTERIOR_ADDON_NAMES,
    "Child Seat Clean",
    "Additional Cleaning",
  ],
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

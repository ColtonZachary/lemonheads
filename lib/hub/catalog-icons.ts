export const ADDON_ICON_OPTIONS = [
  "spray",
  "steam",
  "paw",
  "ozone",
  "clay",
  "seat",
  "headlight",
  "clock",
  "engine",
  "ceramic",
] as const;

export type AddonIcon = (typeof ADDON_ICON_OPTIONS)[number];

export function isAddonIcon(value: string): value is AddonIcon {
  return (ADDON_ICON_OPTIONS as readonly string[]).includes(value);
}

/** Distinct hues for detailer lanes on the week calendar */
export const DETAILER_COLOR_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#22c55e",
  "#06b6d4",
  "#e879f9",
] as const;

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

export function normalizeCalendarColor(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  return HEX_RE.test(v) ? v.toLowerCase() : null;
}

export function detailerColorForIndex(index: number): string {
  return DETAILER_COLOR_PALETTE[index % DETAILER_COLOR_PALETTE.length]!;
}

export function resolveDetailerColor(
  name: string,
  index: number,
  customColor?: string | null,
): string {
  return normalizeCalendarColor(customColor) ?? detailerColorForIndex(index);
}

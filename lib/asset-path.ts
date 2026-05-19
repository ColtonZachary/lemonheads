/**
 * Prefix public asset paths with NEXT_PUBLIC_BASE_PATH (e.g. /lemonheads on GitHub Pages).
 * Full URLs (Supabase, etc.) are returned unchanged.
 */
export function assetPath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;

  return `${base.replace(/\/$/, "")}${normalized}`;
}

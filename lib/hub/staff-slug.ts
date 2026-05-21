/** URL-safe slug for `staff_members.slug`. */
export function staffSlugFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base.length > 0 ? base.slice(0, 64) : "staff";
}

import type { SupabaseClient } from "@supabase/supabase-js";

export type DiscountType = "percent" | "fixed_cents";

export type PromoCodeRow = {
  id: string;
  code: string;
  label: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  /** null = all packages */
  package_key: string | null;
};

export async function fetchPromoCodes(
  client: SupabaseClient,
): Promise<PromoCodeRow[]> {
  const { data, error } = await client
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[promo] fetch:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    label: row.label,
    discount_type: row.discount_type as DiscountType,
    discount_value: Number(row.discount_value),
    max_uses: row.max_uses,
    uses_count: row.uses_count,
    active: row.active,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    package_key: row.package_key ?? null,
  }));
}

export function formatPromoPackageScope(
  packageKey: string | null,
  packageNames: Record<string, string>,
): string {
  if (!packageKey) return "All packages";
  return packageNames[packageKey] ?? packageKey;
}

export function formatPromoDiscount(row: PromoCodeRow): string {
  if (row.discount_type === "percent") {
    const pct = Number.isInteger(row.discount_value)
      ? String(row.discount_value)
      : row.discount_value.toFixed(1);
    return `${pct}% off`;
  }
  return `$${(row.discount_value / 100).toFixed(2)} off`;
}

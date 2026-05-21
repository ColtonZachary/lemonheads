import type { SupabaseClient } from "@supabase/supabase-js";

import type { PromoCodeRow } from "@/lib/hub/promo-db";

export function normalizePromoCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

export async function fetchPromoByCode(
  client: SupabaseClient,
  code: string,
): Promise<PromoCodeRow | null> {
  if (!code) return null;

  const { data, error } = await client
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    code: data.code,
    label: data.label,
    discount_type: data.discount_type,
    discount_value: Number(data.discount_value),
    max_uses: data.max_uses,
    uses_count: data.uses_count,
    active: data.active,
    valid_from: data.valid_from,
    valid_until: data.valid_until,
    package_key: data.package_key ?? null,
  };
}

export function isPromoCurrentlyValid(
  promo: PromoCodeRow,
): { ok: true } | { ok: false; message: string } {
  if (!promo.active) {
    return { ok: false, message: "This promo code is no longer active." };
  }

  const now = Date.now();
  if (promo.valid_from && new Date(promo.valid_from).getTime() > now) {
    return { ok: false, message: "This promo code is not active yet." };
  }
  if (promo.valid_until && new Date(promo.valid_until).getTime() < now) {
    return { ok: false, message: "This promo code has expired." };
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return { ok: false, message: "This promo code has reached its usage limit." };
  }

  return { ok: true };
}

export async function incrementPromoUse(
  client: SupabaseClient,
  promoId: string,
): Promise<void> {
  const { data } = await client
    .from("promo_codes")
    .select("uses_count")
    .eq("id", promoId)
    .single();

  if (!data) return;

  await client
    .from("promo_codes")
    .update({ uses_count: data.uses_count + 1 })
    .eq("id", promoId);
}

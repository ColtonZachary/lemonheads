"use server";

import { revalidatePath } from "next/cache";

import type { DiscountType } from "@/lib/hub/promo-db";
import { requireManagerSupabase } from "@/lib/hub/require-manager-supabase";

export type HubPromoActionState = {
  ok: boolean;
  message: string;
};

const PROMO_PATH = "/hub/promos";

function revalidatePromos() {
  revalidatePath(PROMO_PATH);
  revalidatePath("/book");
}

function normalizeCode(raw: string): string | null {
  const code = raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
  return code.length > 0 ? code.slice(0, 32) : null;
}

function parseDiscountType(raw: string): DiscountType | null {
  return raw === "percent" || raw === "fixed_cents" ? raw : null;
}

function parseDollarsToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function parseOptionalMaxUses(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

/** Calendar date (YYYY-MM-DD) → UTC start/end of that calendar day for validity checks. */
function parseValidFrom(raw: string): string | null {
  const d = raw.trim();
  if (!d) return null;
  return `${d}T00:00:00.000Z`;
}

function parseValidUntil(raw: string): string | null {
  const d = raw.trim();
  if (!d) return null;
  return `${d}T23:59:59.999Z`;
}

function parseDiscountValue(
  type: DiscountType,
  raw: string,
): { ok: true; value: number } | { ok: false; message: string } {
  if (type === "percent") {
    const pct = Number.parseFloat(raw.trim());
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return { ok: false, message: "Percent discount must be between 0 and 100." };
    }
    return { ok: true, value: Math.round(pct * 100) / 100 };
  }
  const cents = parseDollarsToCents(raw);
  if (cents === null) {
    return { ok: false, message: "Enter a valid fixed discount amount in dollars." };
  }
  return { ok: true, value: cents };
}

function validateDateRange(
  valid_from: string | null,
  valid_until: string | null,
): string | null {
  if (valid_from && valid_until && valid_until < valid_from) {
    return "End date must be on or after start date.";
  }
  return null;
}

/** null = all packages; string = single package; false = invalid selection */
function parsePackageKey(
  scope: string,
  packageKey: string,
): string | null | false {
  if (scope !== "single") return null;
  const key = packageKey.trim();
  return key.length > 0 ? key : false;
}

export async function createPromoCode(
  _prev: HubPromoActionState,
  formData: FormData,
): Promise<HubPromoActionState> {
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const code = normalizeCode(String(formData.get("code") ?? ""));
  const label = String(formData.get("label") ?? "").trim();
  const discount_type = parseDiscountType(String(formData.get("discount_type") ?? ""));
  const active = String(formData.get("active") ?? "") === "on";
  const max_uses = parseOptionalMaxUses(String(formData.get("max_uses") ?? ""));
  const valid_from = parseValidFrom(String(formData.get("valid_from") ?? ""));
  const valid_until = parseValidUntil(String(formData.get("valid_until") ?? ""));

  if (!code) return { ok: false, message: "Promo code is required (letters and numbers)." };
  if (!discount_type) return { ok: false, message: "Select a discount type." };

  const amountField =
    discount_type === "percent" ? "discount_percent" : "discount_amount";
  const parsed = parseDiscountValue(
    discount_type,
    String(formData.get(amountField) ?? ""),
  );
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const rangeError = validateDateRange(valid_from, valid_until);
  if (rangeError) return { ok: false, message: rangeError };

  const package_key = parsePackageKey(
    String(formData.get("package_scope") ?? ""),
    String(formData.get("package_key") ?? ""),
  );
  if (package_key === false) {
    return { ok: false, message: "Select which package this code applies to." };
  }

  const { error } = await ctx.supabase.from("promo_codes").insert({
    code,
    label,
    discount_type,
    discount_value: parsed.value,
    max_uses,
    active,
    valid_from,
    valid_until,
    package_key,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That code already exists." };
    return { ok: false, message: error.message };
  }

  revalidatePromos();
  return { ok: true, message: `Promo “${code}” created.` };
}

export async function updatePromoCode(
  promoId: string,
  _prev: HubPromoActionState,
  formData: FormData,
): Promise<HubPromoActionState> {
  void _prev;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const code = normalizeCode(String(formData.get("code") ?? ""));
  const label = String(formData.get("label") ?? "").trim();
  const discount_type = parseDiscountType(String(formData.get("discount_type") ?? ""));
  const active = String(formData.get("active") ?? "") === "on";
  const max_uses = parseOptionalMaxUses(String(formData.get("max_uses") ?? ""));
  const valid_from = parseValidFrom(String(formData.get("valid_from") ?? ""));
  const valid_until = parseValidUntil(String(formData.get("valid_until") ?? ""));

  if (!code) return { ok: false, message: "Promo code is required." };
  if (!discount_type) return { ok: false, message: "Select a discount type." };

  const amountField =
    discount_type === "percent" ? "discount_percent" : "discount_amount";
  const parsed = parseDiscountValue(
    discount_type,
    String(formData.get(amountField) ?? ""),
  );
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const rangeError = validateDateRange(valid_from, valid_until);
  if (rangeError) return { ok: false, message: rangeError };

  const package_key = parsePackageKey(
    String(formData.get("package_scope") ?? ""),
    String(formData.get("package_key") ?? ""),
  );
  if (package_key === false) {
    return { ok: false, message: "Select which package this code applies to." };
  }

  const { error } = await ctx.supabase
    .from("promo_codes")
    .update({
      code,
      label,
      discount_type,
      discount_value: parsed.value,
      max_uses,
      active,
      valid_from,
      valid_until,
      package_key,
    })
    .eq("id", promoId);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "That code is already in use." };
    return { ok: false, message: error.message };
  }

  revalidatePromos();
  return { ok: true, message: "Promo updated." };
}

export async function deletePromoCode(
  promoId: string,
  _prev: HubPromoActionState,
  _formData: FormData,
): Promise<HubPromoActionState> {
  void _formData;
  const ctx = await requireManagerSupabase();
  if ("error" in ctx) return { ok: false, message: ctx.error };

  const { error } = await ctx.supabase.from("promo_codes").delete().eq("id", promoId);

  if (error) return { ok: false, message: error.message };

  revalidatePromos();
  return { ok: true, message: "Promo removed." };
}

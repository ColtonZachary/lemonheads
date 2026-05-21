"use server";

import type { VehicleKey } from "@/lib/data";
import { computeBookingPricing } from "@/lib/promos/booking-pricing";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type PromoApplyResult =
  | {
      ok: true;
      code: string;
      discountCents: number;
      subtotalCents: number;
      totalCents: number;
    }
  | { ok: false; message: string };

export async function applyPromoForBooking(input: {
  code: string;
  packageKey: string;
  vehicleKey: VehicleKey;
  addonNames: string[];
}): Promise<PromoApplyResult> {
  const client = getSupabaseAdmin();
  if (!client) {
    return { ok: false, message: "Booking system is unavailable. Please call 833-536-6648." };
  }

  const trimmed = input.code.trim();
  if (!trimmed) {
    return { ok: false, message: "Enter a promo code." };
  }

  const pricing = await computeBookingPricing(client, {
    packageKey: input.packageKey,
    vehicleKey: input.vehicleKey,
    addonNames: input.addonNames,
    promoCode: trimmed,
  });

  if (!pricing.ok) return pricing;
  if (!pricing.promoCode) {
    return { ok: false, message: "That promo code is not valid." };
  }

  return {
    ok: true,
    code: pricing.promoCode,
    discountCents: pricing.discountCents,
    subtotalCents: pricing.subtotalCents,
    totalCents: pricing.totalCents,
  };
}

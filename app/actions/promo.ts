"use server";

import type { VehicleKey } from "@/lib/data";
import { computeCheckoutPricing } from "@/lib/bookings/checkout-pricing";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type PromoApplyResult =
  | {
      ok: true;
      code: string;
      discountCents: number;
      loyaltyDiscountCents: number;
      subtotalCents: number;
      totalCents: number;
    }
  | { ok: false; message: string };

export async function applyPromoForBooking(input: {
  code: string;
  packageKey: string;
  vehicleKey: VehicleKey;
  addonNames: string[];
  loyaltyRedemptionId?: string;
}): Promise<PromoApplyResult> {
  const client = getSupabaseAdmin();
  if (!client) {
    return { ok: false, message: "Booking system is unavailable. Please call 833-536-6648." };
  }

  const trimmed = input.code.trim();
  if (!trimmed) {
    return { ok: false, message: "Enter a promo code." };
  }

  const pricing = await computeCheckoutPricing(client, {
    packageKey: input.packageKey,
    vehicleKey: input.vehicleKey,
    addonNames: input.addonNames,
    promoCode: trimmed,
    loyaltyRedemptionId: input.loyaltyRedemptionId?.trim() || undefined,
  });

  if (!pricing.ok) return pricing;
  if (!pricing.promoCode) {
    return { ok: false, message: "That promo code is not valid." };
  }

  return {
    ok: true,
    code: pricing.promoCode,
    discountCents: pricing.promoDiscountCents,
    loyaltyDiscountCents: pricing.loyaltyDiscountCents,
    subtotalCents: pricing.subtotalCents,
    totalCents: pricing.totalCents,
  };
}

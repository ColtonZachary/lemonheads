import type { SupabaseClient } from "@supabase/supabase-js";

import type { VehicleKey } from "@/lib/data";
import { computeLoyaltyDiscountCents } from "@/lib/loyalty/checkout-discount";
import { fetchCatalogAddons, fetchCatalogPackages } from "@/lib/hub/catalog-db";
import {
  computeDiscountCents,
  type BookingPricingInput,
} from "@/lib/promos/booking-pricing";
import { fetchPromoByCode, isPromoCurrentlyValid } from "@/lib/promos/promo-validate";

export type CheckoutPricingInput = BookingPricingInput & {
  loyaltyRedemptionId?: string;
};

export type CheckoutPricingResult =
  | {
      ok: true;
      subtotalCents: number;
      promoDiscountCents: number;
      loyaltyDiscountCents: number;
      discountCents: number;
      totalCents: number;
      promoCodeId: string | null;
      promoCode: string | null;
      loyaltyRedemptionId: string | null;
      packageName: string;
    }
  | { ok: false; message: string };

function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

export async function computeCheckoutPricing(
  client: SupabaseClient,
  input: CheckoutPricingInput,
): Promise<CheckoutPricingResult> {
  const packageKey = input.packageKey.trim();
  const vehicleKey = input.vehicleKey;

  if (!packageKey) {
    return { ok: false, message: "Select a service package first." };
  }
  if (!vehicleKey) {
    return { ok: false, message: "Select a vehicle type first." };
  }

  const [packages, addonRows] = await Promise.all([
    fetchCatalogPackages(client),
    fetchCatalogAddons(client),
  ]);

  const pkg = packages.find((p) => p.key === packageKey && p.active);
  if (!pkg) {
    return { ok: false, message: "Selected package is not available." };
  }

  const packageCents = pkg.prices[vehicleKey] ?? 0;
  if (packageCents <= 0) {
    return { ok: false, message: "Pricing is not set for this vehicle type." };
  }

  const activeAddons = addonRows.filter((a) => a.active);
  let addonCents = 0;
  for (const name of input.addonNames) {
    const addon = activeAddons.find((a) => a.name === name);
    if (addon) addonCents += addon.price_cents;
  }

  const subtotalCents = packageCents + addonCents;

  let promoDiscountCents = 0;
  let promoCodeId: string | null = null;
  let promoCode: string | null = null;

  const codeRaw = input.promoCode?.trim() ?? "";
  if (codeRaw) {
    const promo = await fetchPromoByCode(client, normalizeCode(codeRaw));
    if (!promo) {
      return { ok: false, message: "That promo code is not valid." };
    }
    const validity = isPromoCurrentlyValid(promo);
    if (!validity.ok) {
      return { ok: false, message: validity.message };
    }
    if (promo.package_key && promo.package_key !== packageKey) {
      const restricted = packages.find((p) => p.key === promo.package_key);
      return {
        ok: false,
        message: restricted
          ? `This code only applies to ${restricted.name}.`
          : "This code does not apply to the selected package.",
      };
    }
    promoDiscountCents = computeDiscountCents(subtotalCents, promo);
    promoCodeId = promo.id;
    promoCode = promo.code;
  }

  let loyaltyDiscountCents = 0;
  let loyaltyRedemptionId: string | null = null;

  const redemptionId = input.loyaltyRedemptionId?.trim();
  if (redemptionId) {
    const { data: redemption, error } = await client
      .from("loyalty_redemptions")
      .select(
        `
        id,
        status,
        customer_id,
        loyalty_reward_goals (
          reward_kind,
          reward_package_key,
          reward_addon_name
        )
      `,
      )
      .eq("id", redemptionId)
      .maybeSingle();

    if (error || !redemption) {
      return { ok: false, message: "That rewards redemption is not valid." };
    }
    if (redemption.status !== "pending") {
      return { ok: false, message: "That reward has already been used or cancelled." };
    }

    const goal = redemption.loyalty_reward_goals as
      | {
          reward_kind: "package" | "addon";
          reward_package_key: string | null;
          reward_addon_name: string | null;
        }
      | {
          reward_kind: "package" | "addon";
          reward_package_key: string | null;
          reward_addon_name: string | null;
        }[]
      | null;
    const g = Array.isArray(goal) ? goal[0] : goal;
    if (!g) {
      return { ok: false, message: "Reward details are missing." };
    }

    const loyaltyDiscount = computeLoyaltyDiscountCents(
      g,
      packageKey,
      packageCents,
      input.addonNames,
      activeAddons,
    );
    if (!loyaltyDiscount.ok) {
      return loyaltyDiscount;
    }

    loyaltyDiscountCents = loyaltyDiscount.discountCents;
    loyaltyRedemptionId = redemption.id;
  }

  const discountCents = Math.min(
    subtotalCents,
    promoDiscountCents + loyaltyDiscountCents,
  );

  return {
    ok: true,
    subtotalCents,
    promoDiscountCents,
    loyaltyDiscountCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    promoCodeId,
    promoCode,
    loyaltyRedemptionId,
    packageName: pkg.name,
  };
}

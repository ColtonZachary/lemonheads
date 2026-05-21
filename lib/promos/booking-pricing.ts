import type { SupabaseClient } from "@supabase/supabase-js";

import type { VehicleKey } from "@/lib/data";
import { fetchCatalogAddons, fetchCatalogPackages } from "@/lib/hub/catalog-db";
import type { PromoCodeRow } from "@/lib/hub/promo-db";
import { fetchPromoByCode, isPromoCurrentlyValid } from "@/lib/promos/promo-validate";

export type BookingPricingInput = {
  packageKey: string;
  vehicleKey: VehicleKey;
  addonNames: string[];
  promoCode?: string;
};

export type BookingPricingResult =
  | {
      ok: true;
      subtotalCents: number;
      discountCents: number;
      totalCents: number;
      promoCodeId: string | null;
      promoCode: string | null;
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

export function computeDiscountCents(
  subtotalCents: number,
  promo: Pick<PromoCodeRow, "discount_type" | "discount_value">,
): number {
  if (subtotalCents <= 0) return 0;
  if (promo.discount_type === "percent") {
    return Math.min(
      subtotalCents,
      Math.round(subtotalCents * (promo.discount_value / 100)),
    );
  }
  return Math.min(subtotalCents, Math.round(promo.discount_value));
}

export async function computeBookingPricing(
  client: SupabaseClient,
  input: BookingPricingInput,
): Promise<BookingPricingResult> {
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

  const codeRaw = input.promoCode?.trim() ?? "";
  if (!codeRaw) {
    return {
      ok: true,
      subtotalCents,
      discountCents: 0,
      totalCents: subtotalCents,
      promoCodeId: null,
      promoCode: null,
      packageName: pkg.name,
    };
  }

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

  const discountCents = computeDiscountCents(subtotalCents, promo);

  return {
    ok: true,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    promoCodeId: promo.id,
    promoCode: promo.code,
    packageName: pkg.name,
  };
}

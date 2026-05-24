import type { LoyaltyRewardKind } from "@/lib/hub/loyalty-db";
import type { CatalogAddonRow } from "@/lib/hub/catalog-db";

export type LoyaltyRewardTarget = {
  reward_kind: LoyaltyRewardKind;
  reward_package_key: string | null;
  reward_addon_name: string | null;
};

export function computeLoyaltyDiscountCents(
  reward: LoyaltyRewardTarget,
  packageKey: string,
  packageCents: number,
  addonNames: string[],
  addons: Pick<CatalogAddonRow, "name" | "price_cents">[],
): { ok: true; discountCents: number } | { ok: false; message: string } {
  if (reward.reward_kind === "package") {
    const key = reward.reward_package_key?.trim();
    if (!key) {
      return { ok: false, message: "This reward is not configured correctly." };
    }
    if (key !== packageKey) {
      return {
        ok: false,
        message: "This reward only applies to a different service package.",
      };
    }
    if (packageCents <= 0) {
      return { ok: false, message: "Package pricing is not available for this vehicle." };
    }
    return { ok: true, discountCents: packageCents };
  }

  const addonName = reward.reward_addon_name?.trim();
  if (!addonName) {
    return { ok: false, message: "This reward is not configured correctly." };
  }
  if (!addonNames.includes(addonName)) {
    return {
      ok: false,
      message: `Add "${addonName}" to your booking to use this reward.`,
    };
  }
  const addon = addons.find((a) => a.name === addonName);
  if (!addon || addon.price_cents <= 0) {
    return { ok: false, message: "Add-on pricing is not available." };
  }
  return { ok: true, discountCents: addon.price_cents };
}

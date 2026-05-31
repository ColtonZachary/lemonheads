import type { VehicleKey } from "@/lib/data";
import { computeCheckoutPricing } from "@/lib/bookings/checkout-pricing";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return Response.json({ error: "Booking system is unavailable" }, { status: 503 });
  }

  let body: {
    packageKey?: string;
    vehicleKey?: VehicleKey;
    addonNames?: string[];
    promoCode?: string;
    loyaltyRedemptionId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const packageKey = body.packageKey?.trim() ?? "";
  const vehicleKey = body.vehicleKey;
  const addonNames = body.addonNames ?? [];

  if (!packageKey || !vehicleKey) {
    return Response.json(
      { error: "packageKey and vehicleKey are required" },
      { status: 400 },
    );
  }

  try {
    const pricing = await computeCheckoutPricing(admin, {
      packageKey,
      vehicleKey,
      addonNames,
      promoCode: body.promoCode?.trim() || undefined,
      loyaltyRedemptionId: body.loyaltyRedemptionId?.trim() || undefined,
    });

    if (!pricing.ok) {
      return Response.json({ error: pricing.message }, { status: 400 });
    }

    return Response.json({
      subtotalCents: pricing.subtotalCents,
      promoDiscountCents: pricing.promoDiscountCents,
      loyaltyDiscountCents: pricing.loyaltyDiscountCents,
      discountCents: pricing.discountCents,
      totalCents: pricing.totalCents,
      promoCode: pricing.promoCode,
      packageName: pricing.packageName,
      totalDisplay: `$${(pricing.totalCents / 100).toFixed(2)}`,
    });
  } catch (err) {
    console.error("[mobile customer booking preview]", err);
    return Response.json({ error: "Could not compute pricing" }, { status: 500 });
  }
}

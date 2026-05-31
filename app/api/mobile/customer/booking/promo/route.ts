import type { VehicleKey } from "@/lib/data";
import { applyPromoForBooking } from "@/app/actions/promo";

export async function POST(request: Request) {
  let body: {
    code?: string;
    packageKey?: string;
    vehicleKey?: VehicleKey;
    addonNames?: string[];
    loyaltyRedemptionId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const code = body.code?.trim() ?? "";
  const packageKey = body.packageKey?.trim() ?? "";
  const vehicleKey = body.vehicleKey;

  if (!code || !packageKey || !vehicleKey) {
    return Response.json(
      { error: "code, packageKey, and vehicleKey are required" },
      { status: 400 },
    );
  }

  const result = await applyPromoForBooking({
    code,
    packageKey,
    vehicleKey,
    addonNames: body.addonNames ?? [],
    loyaltyRedemptionId: body.loyaltyRedemptionId,
  });

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  return Response.json({
    code: result.code,
    promoDiscountCents: result.discountCents,
    loyaltyDiscountCents: result.loyaltyDiscountCents,
    discountCents: result.discountCents + result.loyaltyDiscountCents,
    subtotalCents: result.subtotalCents,
    totalCents: result.totalCents,
    totalDisplay: `$${(result.totalCents / 100).toFixed(2)}`,
  });
}

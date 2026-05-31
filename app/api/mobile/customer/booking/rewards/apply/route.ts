import type { VehicleKey } from "@/lib/data";
import { applyCheckoutLoyalty } from "@/lib/mobile/apply-checkout-loyalty";
import {
  isCustomerApiError,
  requireCustomerApi,
} from "@/lib/mobile/require-customer-api";

export async function POST(request: Request) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  let body: {
    packageKey?: string;
    vehicleKey?: VehicleKey;
    addonNames?: string[];
    pendingRedemptionId?: string;
    goalId?: string;
    promoCode?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const packageKey = body.packageKey?.trim() ?? "";
  const vehicleKey = body.vehicleKey;

  if (!packageKey || !vehicleKey) {
    return Response.json(
      { error: "packageKey and vehicleKey are required" },
      { status: 400 },
    );
  }

  const result = await applyCheckoutLoyalty(ctx.supabase, {
    packageKey,
    vehicleKey,
    addonNames: body.addonNames ?? [],
    pendingRedemptionId: body.pendingRedemptionId,
    goalId: body.goalId,
    promoCode: body.promoCode,
  });

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  return Response.json({
    redemptionId: result.redemptionId,
    label: result.label,
    discountCents: result.discountCents,
    subtotalCents: result.subtotalCents,
    totalCents: result.totalCents,
    totalDisplay: result.totalDisplay,
  });
}

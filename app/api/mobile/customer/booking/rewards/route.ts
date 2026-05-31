import type { VehicleKey } from "@/lib/data";
import { fetchRewardsCheckoutContext } from "@/lib/loyalty/checkout-context";
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

  try {
    const rewards = await fetchRewardsCheckoutContext(ctx.supabase, {
      packageKey,
      vehicleKey,
      addonNames: body.addonNames ?? [],
    });

    if (!rewards) {
      return Response.json(
        { error: "No customer account found for this login." },
        { status: 403 },
      );
    }

    return Response.json({
      email: rewards.email,
      pointsBalance: rewards.pointsBalance,
      options: rewards.options,
    });
  } catch (err) {
    console.error("[mobile customer booking rewards]", err);
    return Response.json({ error: "Could not load rewards" }, { status: 500 });
  }
}

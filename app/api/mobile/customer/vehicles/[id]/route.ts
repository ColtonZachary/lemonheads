import {
  CUSTOMER_VEHICLE_SELECT,
  parseCustomerVehiclePayload,
  serializeCustomerVehicle,
  type CustomerVehicleRow,
} from "@/lib/mobile/customer-vehicles";
import {
  isCustomerApiError,
  requireCustomerApi,
} from "@/lib/mobile/require-customer-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "Missing vehicle id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseCustomerVehiclePayload(body);
  if (typeof parsed === "string") {
    return Response.json({ error: parsed }, { status: 400 });
  }

  if (
    parsed.vehicleKey === undefined &&
    parsed.vehicleInfo === undefined &&
    parsed.nickname === undefined &&
    parsed.isDefault === undefined
  ) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (parsed.vehicleInfo !== undefined && parsed.vehicleInfo.length < 2) {
    return Response.json(
      { error: "Enter your vehicle year, make, model, and color" },
      { status: 400 },
    );
  }

  const { data: existing, error: loadError } = await ctx.supabase
    .from("customer_vehicles")
    .select("id")
    .eq("id", id)
    .eq("customer_id", ctx.customer.id)
    .maybeSingle();

  if (loadError) {
    console.error("[mobile customer vehicles PATCH load]", loadError.message);
    return Response.json({ error: "Could not update vehicle" }, { status: 500 });
  }

  if (!existing) {
    return Response.json({ error: "Vehicle not found" }, { status: 404 });
  }

  if (parsed.isDefault) {
    await ctx.supabase
      .from("customer_vehicles")
      .update({ is_default: false })
      .eq("customer_id", ctx.customer.id)
      .eq("is_default", true);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.vehicleKey !== undefined) updates.vehicle_key = parsed.vehicleKey;
  if (parsed.vehicleInfo !== undefined) updates.vehicle_info = parsed.vehicleInfo;
  if (parsed.nickname !== undefined) updates.nickname = parsed.nickname || null;
  if (parsed.isDefault !== undefined) updates.is_default = parsed.isDefault;

  const { data, error } = await ctx.supabase
    .from("customer_vehicles")
    .update(updates)
    .eq("id", id)
    .eq("customer_id", ctx.customer.id)
    .select(CUSTOMER_VEHICLE_SELECT)
    .single();

  if (error) {
    console.error("[mobile customer vehicles PATCH]", error.message);
    return Response.json({ error: "Could not update vehicle" }, { status: 500 });
  }

  return Response.json({
    vehicle: serializeCustomerVehicle(data as CustomerVehicleRow),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "Missing vehicle id" }, { status: 400 });
  }

  const { data: existing, error: loadError } = await ctx.supabase
    .from("customer_vehicles")
    .select("id, is_default")
    .eq("id", id)
    .eq("customer_id", ctx.customer.id)
    .maybeSingle();

  if (loadError) {
    console.error("[mobile customer vehicles DELETE load]", loadError.message);
    return Response.json({ error: "Could not delete vehicle" }, { status: 500 });
  }

  if (!existing) {
    return Response.json({ error: "Vehicle not found" }, { status: 404 });
  }

  const { error } = await ctx.supabase
    .from("customer_vehicles")
    .delete()
    .eq("id", id)
    .eq("customer_id", ctx.customer.id);

  if (error) {
    console.error("[mobile customer vehicles DELETE]", error.message);
    return Response.json({ error: "Could not delete vehicle" }, { status: 500 });
  }

  if (existing.is_default) {
    const { data: nextDefault } = await ctx.supabase
      .from("customer_vehicles")
      .select("id")
      .eq("customer_id", ctx.customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (nextDefault) {
      await ctx.supabase
        .from("customer_vehicles")
        .update({ is_default: true })
        .eq("id", nextDefault.id);
    }
  }

  return Response.json({ ok: true });
}

import {
  CUSTOMER_VEHICLE_SELECT,
  parseCustomerVehiclePayload,
  serializeCustomerVehicle,
  validateCreatePayload,
  type CustomerVehicleRow,
} from "@/lib/mobile/customer-vehicles";
import {
  isCustomerApiError,
  requireCustomerApi,
} from "@/lib/mobile/require-customer-api";

export async function GET(request: Request) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from("customer_vehicles")
    .select(CUSTOMER_VEHICLE_SELECT)
    .eq("customer_id", ctx.customer.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mobile customer vehicles GET]", error.message);
    return Response.json({ error: "Could not load vehicles" }, { status: 500 });
  }

  return Response.json({
    vehicles: (data ?? []).map((row) =>
      serializeCustomerVehicle(row as CustomerVehicleRow),
    ),
  });
}

export async function POST(request: Request) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

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

  const validationError = validateCreatePayload(parsed);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const isDefault = parsed.isDefault ?? false;

  if (isDefault) {
    await ctx.supabase
      .from("customer_vehicles")
      .update({ is_default: false })
      .eq("customer_id", ctx.customer.id)
      .eq("is_default", true);
  }

  const { count } = await ctx.supabase
    .from("customer_vehicles")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", ctx.customer.id);

  const shouldDefault = isDefault || (count ?? 0) === 0;

  const { data, error } = await ctx.supabase
    .from("customer_vehicles")
    .insert({
      customer_id: ctx.customer.id,
      vehicle_key: parsed.vehicleKey!,
      vehicle_info: parsed.vehicleInfo!,
      nickname: parsed.nickname || null,
      is_default: shouldDefault,
    })
    .select(CUSTOMER_VEHICLE_SELECT)
    .single();

  if (error) {
    console.error("[mobile customer vehicles POST]", error.message);
    return Response.json({ error: "Could not save vehicle" }, { status: 500 });
  }

  return Response.json({
    vehicle: serializeCustomerVehicle(data as CustomerVehicleRow),
  });
}

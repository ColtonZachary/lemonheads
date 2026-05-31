import {
  CUSTOMER_ADDRESS_SELECT,
  parseCustomerAddressPayload,
  serializeCustomerAddress,
  validateUpdateAddressPayload,
  type CustomerAddressRow,
} from "@/lib/mobile/customer-addresses";
import {
  isCustomerApiError,
  requireCustomerApi,
} from "@/lib/mobile/require-customer-api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return Response.json({ error: "Server storage is not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "Missing address id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseCustomerAddressPayload(body);
  if (typeof parsed === "string") {
    return Response.json({ error: parsed }, { status: 400 });
  }

  if (
    parsed.locationType === undefined &&
    parsed.address === undefined &&
    parsed.city === undefined &&
    parsed.zip === undefined &&
    parsed.nickname === undefined &&
    parsed.isDefault === undefined
  ) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const validationError = validateUpdateAddressPayload(parsed);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { data: existing, error: loadError } = await admin
    .from("customer_addresses")
    .select("id")
    .eq("id", id)
    .eq("customer_id", ctx.customer.id)
    .maybeSingle();

  if (loadError) {
    console.error("[mobile customer addresses PATCH load]", loadError.message);
    return Response.json({ error: "Could not update address" }, { status: 500 });
  }

  if (!existing) {
    return Response.json({ error: "Address not found" }, { status: 404 });
  }

  if (parsed.isDefault) {
    const { error: clearError } = await admin
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", ctx.customer.id)
      .eq("is_default", true);

    if (clearError) {
      console.error("[mobile customer addresses PATCH clear default]", clearError.message);
      return Response.json({ error: "Could not update address" }, { status: 500 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (parsed.locationType !== undefined) updates.location_type = parsed.locationType;
  if (parsed.address !== undefined) updates.address = parsed.address;
  if (parsed.city !== undefined) updates.city = parsed.city;
  if (parsed.zip !== undefined) updates.zip = parsed.zip;
  if (parsed.nickname !== undefined) updates.nickname = parsed.nickname || null;
  if (parsed.isDefault !== undefined) updates.is_default = parsed.isDefault;

  const { data, error } = await admin
    .from("customer_addresses")
    .update(updates)
    .eq("id", id)
    .eq("customer_id", ctx.customer.id)
    .select(CUSTOMER_ADDRESS_SELECT)
    .single();

  if (error) {
    console.error("[mobile customer addresses PATCH]", error.message);
    return Response.json({ error: "Could not update address" }, { status: 500 });
  }

  return Response.json({
    address: serializeCustomerAddress(data as CustomerAddressRow),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return Response.json({ error: "Server storage is not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "Missing address id" }, { status: 400 });
  }

  const { data: existing, error: loadError } = await admin
    .from("customer_addresses")
    .select("id, is_default")
    .eq("id", id)
    .eq("customer_id", ctx.customer.id)
    .maybeSingle();

  if (loadError) {
    console.error("[mobile customer addresses DELETE load]", loadError.message);
    return Response.json({ error: "Could not delete address" }, { status: 500 });
  }

  if (!existing) {
    return Response.json({ error: "Address not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("customer_addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", ctx.customer.id);

  if (error) {
    console.error("[mobile customer addresses DELETE]", error.message);
    return Response.json({ error: "Could not delete address" }, { status: 500 });
  }

  if (existing.is_default) {
    const { data: nextDefault } = await admin
      .from("customer_addresses")
      .select("id")
      .eq("customer_id", ctx.customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (nextDefault) {
      await admin
        .from("customer_addresses")
        .update({ is_default: true })
        .eq("id", nextDefault.id);
    }
  }

  return Response.json({ ok: true });
}

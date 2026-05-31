import {
  CUSTOMER_ADDRESS_SELECT,
  parseCustomerAddressPayload,
  serializeCustomerAddress,
  validateCreateAddressPayload,
  type CustomerAddressRow,
} from "@/lib/mobile/customer-addresses";
import {
  isCustomerApiError,
  requireCustomerApi,
} from "@/lib/mobile/require-customer-api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return Response.json({ error: "Server storage is not configured" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("customer_addresses")
    .select(CUSTOMER_ADDRESS_SELECT)
    .eq("customer_id", ctx.customer.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[mobile customer addresses GET]", error.message);
    return Response.json({ error: "Could not load addresses" }, { status: 500 });
  }

  return Response.json({
    addresses: (data ?? []).map((row) =>
      serializeCustomerAddress(row as CustomerAddressRow),
    ),
  });
}

export async function POST(request: Request) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return Response.json({ error: "Server storage is not configured" }, { status: 503 });
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

  const validationError = validateCreateAddressPayload(parsed);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  const { count } = await admin
    .from("customer_addresses")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", ctx.customer.id);

  const shouldDefault = parsed.isDefault ?? (count ?? 0) === 0;

  if (shouldDefault) {
    const { error: clearError } = await admin
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", ctx.customer.id)
      .eq("is_default", true);

    if (clearError) {
      console.error("[mobile customer addresses POST clear default]", clearError.message);
      return Response.json({ error: "Could not save address" }, { status: 500 });
    }
  }

  const { data, error } = await admin
    .from("customer_addresses")
    .insert({
      customer_id: ctx.customer.id,
      location_type: parsed.locationType!,
      address: parsed.address!,
      city: parsed.city!,
      zip: parsed.zip!,
      nickname: parsed.nickname || null,
      is_default: shouldDefault,
    })
    .select(CUSTOMER_ADDRESS_SELECT)
    .single();

  if (error) {
    console.error("[mobile customer addresses POST]", error.message);
    return Response.json({ error: "Could not save address" }, { status: 500 });
  }

  return Response.json({
    address: serializeCustomerAddress(data as CustomerAddressRow),
  });
}

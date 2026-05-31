import {
  CUSTOMER_BOOKING_LIST_SELECT,
  serializeCustomerBooking,
} from "@/lib/mobile/customer-booking";
import {
  isCustomerApiError,
  requireCustomerApi,
} from "@/lib/mobile/require-customer-api";
import { BookingSchema } from "@/lib/booking-types";
import { submitPublicBooking } from "@/lib/bookings/submit-public-booking";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return Response.json({ error: "Server storage is not configured" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("bookings")
    .select(CUSTOMER_BOOKING_LIST_SELECT)
    .eq("customer_id", ctx.customer.id)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[mobile customer bookings]", error.message);
    return Response.json({ error: "Could not load bookings" }, { status: 500 });
  }

  return Response.json({
    bookings: (data ?? []).map((row) => serializeCustomerBooking(row)),
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Please double-check your booking details.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await submitPublicBooking(parsed.data);

  if (result.status === "error") {
    return Response.json(
      {
        error: result.message,
        fieldErrors: result.fieldErrors,
      },
      { status: 400 },
    );
  }

  if (result.status === "idle") {
    return Response.json({ error: "Unexpected booking state" }, { status: 500 });
  }

  return Response.json({
    bookingId: result.bookingId,
    assignedDetailer: result.assignedDetailer,
  });
}

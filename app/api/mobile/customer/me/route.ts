import {
  isCustomerApiError,
  requireCustomerApi,
} from "@/lib/mobile/require-customer-api";

export async function GET(request: Request) {
  const ctx = await requireCustomerApi(request);
  if (isCustomerApiError(ctx)) return ctx;

  return Response.json({
    customer: {
      id: ctx.customer.id,
      fullName: ctx.customer.display_name,
      email: ctx.customer.email,
      phone: ctx.customer.phone,
      pointsBalance: ctx.customer.points_balance ?? 0,
    },
  });
}

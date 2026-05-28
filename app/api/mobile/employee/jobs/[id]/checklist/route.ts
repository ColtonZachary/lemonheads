import {
  completeDetailChecklist,
  fetchBookingForWorkflow,
} from "@/lib/bookings/detail-workflow";
import { fetchDetailChecklistItems } from "@/lib/hub/detail-checklist-db";
import { getEmployeeMutationClient } from "@/lib/mobile/employee-mutation-client";
import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";
import {
  EMPLOYEE_JOB_DETAIL_SELECT,
  serializeEmployeeJobDetail,
  type EmployeeBookingDetailRow,
} from "@/lib/mobile/employee-booking";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  const { id } = await context.params;
  const booking = await fetchBookingForWorkflow(ctx.supabase, id);
  if (!booking || booking.detailer_name !== ctx.detailerName) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const items = await fetchDetailChecklistItems(ctx.supabase, { activeOnly: true });

  return Response.json({
    phase: booking.detail_phase,
    items: items.map((i) => ({
      id: i.id,
      label: i.label,
      sortOrder: i.sort_order,
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  const { id } = await context.params;
  const body = (await request.json()) as {
    answers?: { itemId: string; checked: boolean }[];
  };

  const booking = await fetchBookingForWorkflow(ctx.supabase, id);
  if (!booking || booking.detailer_name !== ctx.detailerName) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const items = await fetchDetailChecklistItems(ctx.supabase, { activeOnly: true });
  const answers = body.answers ?? [];

  const writeClient = getEmployeeMutationClient();
  if (!writeClient) {
    return Response.json(
      {
        error:
          "Server is missing SUPABASE_SERVICE_ROLE_KEY. Ask your admin to add it to the website env.",
      },
      { status: 503 },
    );
  }

  const result = await completeDetailChecklist(
    writeClient,
    id,
    answers,
    items.map((i) => i.id),
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const { data } = await writeClient
    .from("bookings")
    .select(EMPLOYEE_JOB_DETAIL_SELECT)
    .eq("id", id)
    .single();

  return Response.json({
    ok: true,
    job: data ? serializeEmployeeJobDetail(data as EmployeeBookingDetailRow) : null,
  });
}

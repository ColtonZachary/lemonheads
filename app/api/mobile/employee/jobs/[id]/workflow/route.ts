import {
  applyWorkflowAction,
  fetchBookingForWorkflow,
  type WorkflowAction,
} from "@/lib/bookings/detail-workflow";
import { centralScheduleLabels } from "@/lib/hub/schedule-labels";
import { getEmployeeMutationClient } from "@/lib/mobile/employee-mutation-client";
import {
  EMPLOYEE_JOB_DETAIL_SELECT,
  serializeEmployeeJobDetail,
  type EmployeeBookingDetailRow,
} from "@/lib/mobile/employee-booking";
import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";
import {
  notifyCustomerDetailerArrived,
  notifyCustomerDetailerEnRoute,
  notifyCustomerDetailerFinished,
} from "@/lib/notifications/customer-sms";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  const { id } = await context.params;
  const body = (await request.json()) as { action?: string };
  const action = body.action as WorkflowAction | undefined;

  if (!action || !["start", "arrived", "finished"].includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const booking = await fetchBookingForWorkflow(ctx.supabase, id);
  if (!booking || booking.detailer_name !== ctx.detailerName) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

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

  const result = await applyWorkflowAction(
    writeClient,
    booking,
    action,
    ctx.userId,
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const smsClient = writeClient;
  const { dateLabel, timeLabel } = centralScheduleLabels(booking.starts_at);
  const smsData = {
    phone: booking.phone,
    customerName: booking.customer_name,
    service: booking.service_name,
    date: dateLabel,
    time: timeLabel,
    referenceId: booking.reference_id,
    detailerName: ctx.detailerName,
    bookingId: booking.id,
  };

  if (result.smsEvent === "detailer.en_route") {
    await notifyCustomerDetailerEnRoute(smsClient, smsData);
  } else if (result.smsEvent === "detailer.arrived") {
    await notifyCustomerDetailerArrived(smsClient, smsData);
  } else if (result.smsEvent === "detailer.finished") {
    await notifyCustomerDetailerFinished(smsClient, smsData);
  }

  const { data: updated } = await writeClient
    .from("bookings")
    .select(EMPLOYEE_JOB_DETAIL_SELECT)
    .eq("id", id)
    .single();

  return Response.json({
    ok: true,
    phase: result.phase,
    smsQueued: Boolean(result.smsEvent),
    job: updated
      ? serializeEmployeeJobDetail(updated as EmployeeBookingDetailRow)
      : null,
  });
}

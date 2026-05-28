import { countBookingPhotos } from "@/lib/bookings/detail-workflow";
import { listBookingJobPhotos } from "@/lib/hub/booking-job-photos";
import {
  EMPLOYEE_JOB_DETAIL_SELECT,
  serializeEmployeeJobDetail,
  type EmployeeBookingDetailRow,
} from "@/lib/mobile/employee-booking";
import { getEmployeeMutationClient } from "@/lib/mobile/employee-mutation-client";
import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  const { id } = await context.params;

  const { data, error } = await ctx.supabase
    .from("bookings")
    .select(EMPLOYEE_JOB_DETAIL_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[mobile employee job detail]", error.message);
    return Response.json({ error: "Could not load job" }, { status: 500 });
  }

  if (!data) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const row = data as EmployeeBookingDetailRow;
  if (row.detailer_name !== ctx.detailerName) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const photoClient = getEmployeeMutationClient() ?? ctx.supabase;
  const [photos, beforeCount, afterCount] = await Promise.all([
    listBookingJobPhotos(photoClient, id),
    countBookingPhotos(photoClient, id, "before"),
    countBookingPhotos(photoClient, id, "after"),
  ]);

  return Response.json({
    job: serializeEmployeeJobDetail(row),
    photos,
    beforePhotoCount: beforeCount,
    afterPhotoCount: afterCount,
  });
}

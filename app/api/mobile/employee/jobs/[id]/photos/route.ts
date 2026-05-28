import {
  countBookingPhotos,
  fetchBookingForWorkflow,
  syncPhaseAfterAfterPhoto,
  syncPhaseAfterBeforePhoto,
} from "@/lib/bookings/detail-workflow";
import {
  listBookingJobPhotos,
  uploadBookingJobPhoto,
} from "@/lib/hub/booking-job-photos";
import { getEmployeeMutationClient } from "@/lib/mobile/employee-mutation-client";
import { isEmployeeApiError, requireEmployeeApi } from "@/lib/mobile/require-employee-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ctx = await requireEmployeeApi(request);
  if (isEmployeeApiError(ctx)) return ctx;

  const { id } = await context.params;
  const form = await request.formData();
  const phase = form.get("phase");
  const file = form.get("file");

  if (phase !== "before" && phase !== "after") {
    return Response.json({ error: "Invalid phase" }, { status: 400 });
  }
  if (!(file instanceof File) || !file.size) {
    return Response.json({ error: "Missing photo file" }, { status: 400 });
  }

  const booking = await fetchBookingForWorkflow(ctx.supabase, id);
  if (!booking || booking.detailer_name !== ctx.detailerName) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const allowedBefore = ["arrived", "awaiting_finish"].includes(booking.detail_phase);
  const allowedAfter = booking.detail_phase === "awaiting_after_photos";

  if (phase === "before" && !allowedBefore) {
    return Response.json(
      { error: "Before photos can be added after you arrive." },
      { status: 400 },
    );
  }
  if (phase === "after" && !allowedAfter) {
    return Response.json(
      { error: "After photos can be added after you mark the job finished." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const uploaded = await uploadBookingJobPhoto(
    id,
    phase,
    bytes,
    file.type || "image/jpeg",
    ctx.userId,
  );

  if (!uploaded.ok) {
    return Response.json({ error: uploaded.error }, { status: 500 });
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

  if (phase === "before") {
    await syncPhaseAfterBeforePhoto(writeClient, id);
  } else {
    await syncPhaseAfterAfterPhoto(writeClient, id);
  }

  const beforeCount = await countBookingPhotos(writeClient, id, "before");
  const afterCount = await countBookingPhotos(writeClient, id, "after");

  const [refreshed, photos] = await Promise.all([
    fetchBookingForWorkflow(writeClient, id),
    listBookingJobPhotos(writeClient, id),
  ]);

  return Response.json({
    ok: true,
    photo: uploaded.photo,
    photos,
    beforeCount,
    afterCount,
    phase: refreshed?.detail_phase ?? booking.detail_phase,
  });
}

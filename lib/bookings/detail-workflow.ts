import type { SupabaseClient } from "@supabase/supabase-js";

export type BookingDetailPhase =
  | "awaiting_start"
  | "en_route"
  | "arrived"
  | "awaiting_finish"
  | "awaiting_after_photos"
  | "awaiting_checklist"
  | "complete";

export type WorkflowAction = "start" | "arrived" | "finished";

export type BookingWorkflowRow = {
  id: string;
  reference_id: string;
  customer_name: string;
  phone: string;
  email: string;
  service_name: string;
  detailer_name: string | null;
  status: string;
  detail_phase: BookingDetailPhase;
  detail_en_route_at: string | null;
  detail_arrived_at: string | null;
  detail_finished_at: string | null;
  detail_checklist_completed_at: string | null;
  starts_at: string;
  ends_at: string;
  appointment_date: string;
};

const WORKFLOW_SELECT = `
  id, reference_id, customer_name, phone, email, service_name,
  detailer_name, status, detail_phase,
  detail_en_route_at, detail_arrived_at, detail_finished_at, detail_checklist_completed_at,
  starts_at, ends_at, appointment_date
`;

export async function fetchBookingForWorkflow(
  client: SupabaseClient,
  bookingId: string,
): Promise<BookingWorkflowRow | null> {
  const { data, error } = await client
    .from("bookings")
    .select(WORKFLOW_SELECT)
    .eq("id", bookingId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[workflow] fetch booking:", error.message);
    return null;
  }
  return data as BookingWorkflowRow | null;
}

export async function countBookingPhotos(
  client: SupabaseClient,
  bookingId: string,
  phase: "before" | "after",
): Promise<number> {
  const { count, error } = await client
    .from("booking_job_photos")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .eq("phase", phase);

  if (error) {
    console.error("[workflow] count photos:", error.message);
    return 0;
  }
  return count ?? 0;
}

export function workflowActionForPhase(
  phase: BookingDetailPhase,
): WorkflowAction | "upload_before_photos" | "upload_after_photos" | "complete_checklist" | null {
  switch (phase) {
    case "awaiting_start":
      return "start";
    case "en_route":
      return "arrived";
    case "arrived":
    case "awaiting_finish":
      return "upload_before_photos";
    case "awaiting_after_photos":
      return "upload_after_photos";
    case "awaiting_checklist":
      return "complete_checklist";
    default:
      return null;
  }
}

export function canPressFinished(phase: BookingDetailPhase, beforePhotoCount: number): boolean {
  return (
    (phase === "arrived" || phase === "awaiting_finish") &&
    beforePhotoCount > 0
  );
}

export function canCompleteChecklist(
  phase: BookingDetailPhase,
  afterPhotoCount: number,
): boolean {
  return phase === "awaiting_checklist" && afterPhotoCount > 0;
}

export type ApplyWorkflowResult =
  | { ok: true; phase: BookingDetailPhase; smsEvent?: string }
  | { ok: false; error: string };

export async function applyWorkflowAction(
  client: SupabaseClient,
  booking: BookingWorkflowRow,
  action: WorkflowAction,
  actorId: string,
): Promise<ApplyWorkflowResult> {
  const now = new Date().toISOString();
  const phase = (booking.detail_phase ?? "awaiting_start") as BookingDetailPhase;

  if (action === "start") {
    if (phase !== "awaiting_start") {
      return { ok: false, error: "Job already started." };
    }
    const { error } = await client
      .from("bookings")
      .update({
        detail_phase: "en_route",
        detail_en_route_at: now,
        detail_started_by: actorId,
        status: "in_progress",
      })
      .eq("id", booking.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, phase: "en_route", smsEvent: "detailer.en_route" };
  }

  if (action === "arrived") {
    if (phase !== "en_route") {
      return { ok: false, error: "Mark the job as started first." };
    }
    const { error } = await client
      .from("bookings")
      .update({
        detail_phase: "arrived",
        detail_arrived_at: now,
      })
      .eq("id", booking.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, phase: "arrived", smsEvent: "detailer.arrived" };
  }

  if (action === "finished") {
    if (phase !== "arrived" && phase !== "awaiting_finish") {
      return { ok: false, error: "Arrive at the job before marking finished." };
    }
    const beforeCount = await countBookingPhotos(client, booking.id, "before");
    if (beforeCount < 1) {
      return {
        ok: false,
        error: "Add at least one before photo before marking finished.",
      };
    }
    const { error } = await client
      .from("bookings")
      .update({
        detail_phase: "awaiting_after_photos",
        detail_finished_at: now,
      })
      .eq("id", booking.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, phase: "awaiting_after_photos", smsEvent: "detailer.finished" };
  }

  return { ok: false, error: "Unknown action." };
}

/** After first before photo while arrived, move to awaiting_finish for clearer UX. */
export async function syncPhaseAfterBeforePhoto(
  client: SupabaseClient,
  bookingId: string,
): Promise<void> {
  const booking = await fetchBookingForWorkflow(client, bookingId);
  if (!booking || booking.detail_phase !== "arrived") return;
  await client
    .from("bookings")
    .update({ detail_phase: "awaiting_finish" })
    .eq("id", bookingId);
}

/** After first after photo, open checklist step. */
export async function syncPhaseAfterAfterPhoto(
  client: SupabaseClient,
  bookingId: string,
): Promise<void> {
  const afterCount = await countBookingPhotos(client, bookingId, "after");
  if (afterCount < 1) return;
  await client
    .from("bookings")
    .update({ detail_phase: "awaiting_checklist" })
    .eq("id", bookingId)
    .eq("detail_phase", "awaiting_after_photos");
}

export async function completeDetailChecklist(
  client: SupabaseClient,
  bookingId: string,
  answers: { itemId: string; checked: boolean }[],
  activeItemIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const booking = await fetchBookingForWorkflow(client, bookingId);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.detail_phase !== "awaiting_checklist") {
    return { ok: false, error: "Complete after photos first." };
  }

  const afterCount = await countBookingPhotos(client, bookingId, "after");
  if (afterCount < 1) {
    return { ok: false, error: "Add at least one after photo." };
  }

  const unchecked = activeItemIds.filter(
    (id) => !answers.some((a) => a.itemId === id && a.checked),
  );
  if (unchecked.length > 0) {
    return { ok: false, error: "Check every item on the list before completing." };
  }

  const now = new Date().toISOString();
  for (const itemId of activeItemIds) {
    await client.from("booking_checklist_answers").upsert({
      booking_id: bookingId,
      item_id: itemId,
      checked: true,
      checked_at: now,
    });
  }

  const { error } = await client
    .from("bookings")
    .update({
      detail_phase: "complete",
      detail_checklist_completed_at: now,
      status: "completed",
    })
    .eq("id", bookingId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

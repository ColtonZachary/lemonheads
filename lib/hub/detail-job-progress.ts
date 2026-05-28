/** Detail phases where the detailer has started the field workflow. */
const ACTIVE_DETAIL_PHASES = new Set([
  "en_route",
  "arrived",
  "awaiting_finish",
  "awaiting_after_photos",
  "awaiting_checklist",
]);

export type ManagerJobProgress = {
  label: "In progress" | "Completed";
  tone: "progress" | "completed";
};

export function getManagerJobProgress(booking: {
  status: string;
  detail_phase?: string | null;
}): ManagerJobProgress | null {
  if (booking.status === "cancelled") return null;

  const phase = booking.detail_phase ?? "awaiting_start";

  if (booking.status === "completed" || phase === "complete") {
    return { label: "Completed", tone: "completed" };
  }

  if (
    booking.status === "in_progress" ||
    ACTIVE_DETAIL_PHASES.has(phase)
  ) {
    return { label: "In progress", tone: "progress" };
  }

  return null;
}

export function isMissingDetailPhaseColumn(error: {
  message?: string;
  code?: string;
}): boolean {
  return (
    error.code === "42703" ||
    (error.message?.includes("detail_phase") ?? false)
  );
}

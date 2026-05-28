import { DetailJobProgressBadge } from "@/components/hub/detail-job-progress-badge";
import { getManagerJobProgress } from "@/lib/hub/detail-job-progress";
import { formatCentralDateTime } from "@/lib/hub/format";

const PHASE_STEPS: { key: string; label: string }[] = [
  { key: "awaiting_start", label: "Not started" },
  { key: "en_route", label: "On the way" },
  { key: "arrived", label: "Arrived" },
  { key: "awaiting_finish", label: "Before photos" },
  { key: "awaiting_after_photos", label: "After photos" },
  { key: "awaiting_checklist", label: "Checklist" },
  { key: "complete", label: "Done" },
];

export function BookingDetailProgress({
  status,
  detailPhase,
  detailEnRouteAt,
  detailArrivedAt,
  detailFinishedAt,
  detailChecklistCompletedAt,
}: {
  status: string;
  detailPhase?: string | null;
  detailEnRouteAt?: string | null;
  detailArrivedAt?: string | null;
  detailFinishedAt?: string | null;
  detailChecklistCompletedAt?: string | null;
}) {
  const phase = detailPhase ?? "awaiting_start";
  const progress = getManagerJobProgress({ status, detail_phase: phase });
  const stepIndex = PHASE_STEPS.findIndex((s) => s.key === phase);
  const currentStep = stepIndex >= 0 ? PHASE_STEPS[stepIndex] : null;

  return (
    <section className="rounded-md border border-white/10 bg-card2/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          Field progress
        </h2>
        {progress ? (
          <DetailJobProgressBadge status={status} detailPhase={phase} />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text/40">
            Not started
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-text/55">
        Updated from the employee app when the detailer starts and completes the job.
      </p>
      {currentStep && phase !== "awaiting_start" && (
        <p className="mt-3 font-mono text-xs text-text/70">
          Current step:{" "}
          <span className="text-y/90">{currentStep.label}</span>
        </p>
      )}
      <ul className="mt-4 space-y-1.5 font-mono text-[10px] text-text/45">
        {detailEnRouteAt && (
          <li>Started · {formatCentralDateTime(detailEnRouteAt)}</li>
        )}
        {detailArrivedAt && (
          <li>Arrived · {formatCentralDateTime(detailArrivedAt)}</li>
        )}
        {detailFinishedAt && (
          <li>Marked finished · {formatCentralDateTime(detailFinishedAt)}</li>
        )}
        {detailChecklistCompletedAt && (
          <li>Completed · {formatCentralDateTime(detailChecklistCompletedAt)}</li>
        )}
      </ul>
    </section>
  );
}

import { DetailJobProgressBadge } from "@/components/hub/detail-job-progress-badge";
import { HubSection } from "@/components/hub/hub-page";
import { Badge } from "@/components/ui/badge";
import { getManagerJobProgress } from "@/lib/hub/detail-job-progress";
import { formatCentralDateTime } from "@/lib/hub/format";
import { cn } from "@/lib/utils";

const PHASE_STEPS: { key: string; label: string; short: string }[] = [
  { key: "awaiting_start", label: "Not started", short: "Start" },
  { key: "en_route", label: "On the way", short: "En route" },
  { key: "arrived", label: "Arrived", short: "Arrived" },
  { key: "awaiting_finish", label: "Before photos", short: "Before" },
  { key: "awaiting_after_photos", label: "After photos", short: "After" },
  { key: "awaiting_checklist", label: "Checklist", short: "List" },
  { key: "complete", label: "Done", short: "Done" },
];

function FieldProgressHeader({
  status,
  phase,
}: {
  status: string;
  phase: string;
}) {
  const progress = getManagerJobProgress({ status, detail_phase: phase });
  if (progress) {
    return <DetailJobProgressBadge status={status} detailPhase={phase} size="sm" />;
  }
  return (
    <Badge variant="outline" className="font-mono text-[9px] uppercase">
      Not started
    </Badge>
  );
}

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
  const stepIndex = PHASE_STEPS.findIndex((s) => s.key === phase);
  const showStepper =
    phase !== "awaiting_start" ||
    status === "in_progress" ||
    status === "completed";

  const timestamps = [
    detailEnRouteAt && { label: "Started", at: detailEnRouteAt },
    detailArrivedAt && { label: "Arrived", at: detailArrivedAt },
    detailFinishedAt && { label: "Finished", at: detailFinishedAt },
    detailChecklistCompletedAt && { label: "Completed", at: detailChecklistCompletedAt },
  ].filter(Boolean) as { label: string; at: string }[];

  return (
    <HubSection
      compact
      title="Field progress"
      description="Employee app · en route through checklist"
      headerAction={<FieldProgressHeader status={status} phase={phase} />}
    >
      {showStepper ? (
        <div
          className="flex flex-wrap gap-1"
          role="list"
          aria-label="Detail workflow steps"
        >
          {PHASE_STEPS.map((s, i) => {
            const done = stepIndex >= 0 && i < stepIndex;
            const current = i === stepIndex;
            return (
              <span
                key={s.key}
                role="listitem"
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-[8px] uppercase tracking-wide",
                  current
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-border bg-muted/60 text-muted-foreground"
                      : "border-transparent text-muted-foreground/50",
                )}
              >
                {s.short}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="font-mono text-xs text-muted-foreground">
          Detailer has not started this job in the field app yet.
        </p>
      )}

      {timestamps.length > 0 ? (
        <ul className="mt-3 space-y-0.5 border-t border-border pt-2 font-mono text-[10px] text-muted-foreground">
          {timestamps.map((t) => (
            <li key={t.label}>
              {t.label} · {formatCentralDateTime(t.at)}
            </li>
          ))}
        </ul>
      ) : null}
    </HubSection>
  );
}

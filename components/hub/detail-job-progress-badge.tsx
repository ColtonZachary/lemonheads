import { getManagerJobProgress } from "@/lib/hub/detail-job-progress";
import { cn } from "@/lib/utils";

export function DetailJobProgressBadge({
  status,
  detailPhase,
  className,
  size = "md",
}: {
  status: string;
  detailPhase?: string | null;
  className?: string;
  size?: "sm" | "md";
}) {
  const progress = getManagerJobProgress({
    status,
    detail_phase: detailPhase,
  });

  if (!progress) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded font-mono font-semibold uppercase tracking-[0.1em]",
        size === "sm" ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[10px]",
        progress.tone === "completed"
          ? "bg-emerald-500/20 text-emerald-300"
          : "bg-amber-500/20 text-amber-200",
        className,
      )}
    >
      {progress.label}
    </span>
  );
}

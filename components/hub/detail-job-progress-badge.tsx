import { Badge } from "@/components/ui/badge";
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
    <Badge
      variant={progress.tone === "completed" ? "default" : "secondary"}
      className={cn(
        "font-mono uppercase tracking-[0.1em]",
        size === "sm" ? "text-[8px]" : "text-[10px]",
        className,
      )}
    >
      {progress.label}
    </Badge>
  );
}

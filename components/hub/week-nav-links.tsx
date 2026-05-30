import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Prev / week label / Next — same pattern as the hub calendar. */
export function WeekNavLinks({
  weekLabel,
  prevHref,
  nextHref,
  compact,
}: {
  weekLabel: string;
  prevHref: string;
  nextHref: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size={compact ? "xs" : "sm"}>
        <Link href={prevHref} scroll={false}>
          ← Prev
        </Link>
      </Button>
      <span
        className={
          compact
            ? "font-mono text-xs text-primary"
            : "font-display text-2xl uppercase tracking-[0.04em] text-primary"
        }
      >
        {weekLabel}
      </span>
      <Button asChild variant="outline" size={compact ? "xs" : "sm"}>
        <Link href={nextHref} scroll={false}>
          Next →
        </Link>
      </Button>
    </div>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Prev / week label / Next — same pattern as the hub calendar. */
export function WeekNavLinks({
  weekLabel,
  prevHref,
  nextHref,
}: {
  weekLabel: string;
  prevHref: string;
  nextHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={prevHref} scroll={false}>
          ← Prev
        </Link>
      </Button>
      <span className="font-display text-2xl tracking-[0.04em] text-y">
        {weekLabel}
      </span>
      <Button asChild variant="outline" size="sm">
        <Link href={nextHref} scroll={false}>
          Next →
        </Link>
      </Button>
    </div>
  );
}

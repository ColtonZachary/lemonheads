import { cn } from "@/lib/utils";

type ScheduleSectionProps = {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  tone: "amber" | "emerald" | "red";
  defaultOpen?: boolean;
  children: React.ReactNode;
};

const toneDot = {
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  red: "bg-red-400",
} as const;

export function ScheduleSection({
  id,
  title,
  subtitle,
  count,
  tone,
  defaultOpen = true,
  children,
}: ScheduleSectionProps) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-md border border-white/10 bg-dk/40"
    >
      <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneDot[tone])}
              aria-hidden
            />
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-text/80">
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-text/45">{subtitle}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-text/50">
            {count === 0 ? "None" : count}
          </span>
        </div>
        <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.1em] text-text/30 group-open:hidden">
          Show
        </span>
        <span className="mt-2 hidden font-mono text-[9px] uppercase tracking-[0.1em] text-text/30 group-open:block">
          Hide
        </span>
      </summary>
      <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5">{children}</div>
    </details>
  );
}

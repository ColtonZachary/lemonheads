import { WeekNavLinks } from "@/components/hub/week-nav-links";
import {
  formatPayCents,
  type DetailerPayReport,
  type DetailerPaySummary,
} from "@/lib/hub/detailer-pay-report";
import { cn } from "@/lib/utils";

function DetailerPayCard({
  detailer,
  defaultOpen = true,
}: {
  detailer: DetailerPaySummary;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="overflow-hidden rounded-lg border border-white/10 bg-card/30"
    >
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-y/90">{detailer.detailerName}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em]",
                detailer.isSenior
                  ? "bg-y/15 text-y"
                  : "bg-white/10 text-text/55",
              )}
            >
              {detailer.tierLabel}
            </span>
            <span className="font-mono text-[9px] text-text/40">
              {detailer.jobCount} job{detailer.jobCount === 1 ? "" : "s"}
            </span>
          </div>
          <span className="font-mono text-sm text-y">
            {formatPayCents(detailer.totalPayCents)}
          </span>
        </div>
      </summary>

      <div className="space-y-4 border-t border-white/10 px-4 py-3">
        {detailer.weeks.map((week) => (
          <div key={week.weekStart}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/55">
                {week.weekLabel}
              </h4>
              <span className="font-mono text-xs text-y/80">
                {formatPayCents(week.totalPayCents)}
                <span className="ml-2 text-[9px] text-text/40">
                  pkg {formatPayCents(week.packagePayCents)} · add-ons{" "}
                  {formatPayCents(week.addonPayCents)}
                </span>
              </span>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-[0.1em] text-text/40">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 pr-3 text-right">Package</th>
                    <th className="py-2 pr-3">Add-ons</th>
                    <th className="py-2 text-right">Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {week.jobs.map((job, idx) => (
                    <tr
                      key={`${job.appointmentDate}-${job.serviceName}-${idx}`}
                      className="border-b border-white/5 font-mono text-[11px] text-text/65"
                    >
                      <td className="py-2 pr-3 text-text/50">{job.appointmentDate}</td>
                      <td className="py-2 pr-3 text-text/80">{job.serviceName}</td>
                      <td className="py-2 pr-3 text-right text-text/55">
                        {formatPayCents(job.packagePayCents)}
                      </td>
                      <td className="py-2 pr-3 text-text/45">
                        {job.addonLines.length ? (
                          <ul className="space-y-0.5">
                            {job.addonLines.map((a) => (
                              <li key={a.name}>
                                {a.name}{" "}
                                <span className="text-text/35">
                                  {formatPayCents(a.payCents)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 text-right text-y/85">
                        {formatPayCents(job.totalPayCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export function ReportsDetailerPaySection({
  pay,
  singleDetailer = false,
  payWeekLabel,
  payWeekPrevHref,
  payWeekNextHref,
}: {
  pay: DetailerPayReport;
  /** Detailers viewing their own pay — hide duplicate section header. */
  singleDetailer?: boolean;
  payWeekLabel?: string;
  payWeekPrevHref?: string;
  payWeekNextHref?: string;
}) {
  const weekNav =
    payWeekLabel && payWeekPrevHref && payWeekNextHref ? (
      <WeekNavLinks
        weekLabel={payWeekLabel}
        prevHref={payWeekPrevHref}
        nextHref={payWeekNextHref}
      />
    ) : null;
  return (
    <section
      className={cn(
        singleDetailer ? "mt-8" : "mt-12 border-t border-white/10 pt-10",
      )}
    >
      {weekNav ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {weekNav}
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text/40">
            Central Time · Mon–Sun
          </p>
        </div>
      ) : null}

      {!singleDetailer ? (
        <div
          className={cn(
            "flex flex-wrap items-end justify-between gap-3",
            weekNav && "mt-4",
          )}
        >
          <div>
            <h2 className="font-display text-3xl tracking-[0.03em] text-y">
              DETAILER PAY
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text/45">
              Flat pay per package and add-on by tier (Regular vs Senior). Excludes
              cancelled and deleted jobs · one calendar week at a time.
            </p>
          </div>
          <div className="rounded-lg border border-y/20 bg-y/5 px-4 py-2.5 text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text/45">
              {weekNav ? "Week total" : "Total in range"}
            </p>
            <p className="font-display text-2xl text-y">
              {formatPayCents(pay.grandTotalCents)}
            </p>
          </div>
        </div>
      ) : !weekNav ? (
        <p className="font-mono text-[9px] text-text/35">
          {pay.from} → {pay.to} · Central appointment dates · grouped by week
          (Mon–Sun)
        </p>
      ) : null}

      {pay.detailers.length ? (
        <div className={cn("space-y-3", singleDetailer ? "mt-4" : "mt-6")}>
          {pay.detailers.map((d) => (
            <DetailerPayCard
              key={d.detailerName}
              detailer={d}
              defaultOpen={singleDetailer}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-white/10 px-4 py-8 text-center text-sm text-text/40">
          No detailer jobs in this date range.
        </p>
      )}
    </section>
  );
}

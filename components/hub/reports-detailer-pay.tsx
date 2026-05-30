import { HubEmptyState, HubSection, HubStatCard } from "@/components/hub/hub-page";
import { WeekNavLinks } from "@/components/hub/week-nav-links";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      className="group overflow-hidden rounded-lg border border-border/80 bg-card/40"
    >
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-primary">{detailer.detailerName}</span>
            <Badge
              variant={detailer.isSenior ? "default" : "secondary"}
              className="font-mono text-[8px] uppercase"
            >
              {detailer.tierLabel}
            </Badge>
            <span className="font-mono text-[9px] text-muted-foreground">
              {detailer.jobCount} job{detailer.jobCount === 1 ? "" : "s"}
            </span>
          </div>
          <span className="font-mono text-sm text-primary">
            {formatPayCents(detailer.totalPayCents)}
          </span>
        </div>
      </summary>

      <CardContent className="space-y-4 border-t border-border/60 px-4 py-3">
        {detailer.weeks.map((week) => (
          <div key={week.weekStart}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {week.weekLabel}
              </h4>
              <span className="font-mono text-xs text-primary">
                {formatPayCents(week.totalPayCents)}
                <span className="ml-2 text-[9px] text-muted-foreground">
                  pkg {formatPayCents(week.packagePayCents)} · add-ons{" "}
                  {formatPayCents(week.addonPayCents)}
                </span>
              </span>
            </div>

            <Table className="mt-2">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-mono text-[9px] uppercase text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="font-mono text-[9px] uppercase text-muted-foreground">
                    Service
                  </TableHead>
                  <TableHead className="text-right font-mono text-[9px] uppercase text-muted-foreground">
                    Package
                  </TableHead>
                  <TableHead className="font-mono text-[9px] uppercase text-muted-foreground">
                    Add-ons
                  </TableHead>
                  <TableHead className="text-right font-mono text-[9px] uppercase text-muted-foreground">
                    Pay
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {week.jobs.map((job, idx) => (
                  <TableRow
                    key={`${job.appointmentDate}-${job.serviceName}-${idx}`}
                    className="font-mono text-[11px]"
                  >
                    <TableCell className="text-muted-foreground">
                      {job.appointmentDate}
                    </TableCell>
                    <TableCell>{job.serviceName}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPayCents(job.packagePayCents)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.addonLines.length ? (
                        <ul className="space-y-0.5">
                          {job.addonLines.map((a) => (
                            <li key={a.name}>
                              {a.name}{" "}
                              <span className="text-muted-foreground/70">
                                {formatPayCents(a.payCents)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-primary">
                      {formatPayCents(job.totalPayCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </details>
  );
}

export function ReportsDetailerPaySection({
  pay,
  singleDetailer = false,
  payWeekLabel,
  payWeekPrevHref,
  payWeekNextHref,
  embedded = false,
}: {
  pay: DetailerPayReport;
  singleDetailer?: boolean;
  payWeekLabel?: string;
  payWeekPrevHref?: string;
  payWeekNextHref?: string;
  /** Compact block inside reports dashboard collapsible */
  embedded?: boolean;
}) {
  const weekNav =
    payWeekLabel && payWeekPrevHref && payWeekNextHref ? (
      <WeekNavLinks
        weekLabel={payWeekLabel}
        prevHref={payWeekPrevHref}
        nextHref={payWeekNextHref}
      />
    ) : null;

  const detailerList = pay.detailers.length ? (
    <div className={cn("space-y-2", !embedded && "space-y-3")}>
      {pay.detailers.map((d) => (
        <DetailerPayCard
          key={d.detailerName}
          detailer={d}
          defaultOpen={embedded ? false : singleDetailer}
        />
      ))}
    </div>
  ) : (
    <HubEmptyState className={embedded ? "py-4 text-[10px]" : undefined}>
      No detailer jobs in this date range.
    </HubEmptyState>
  );

  if (embedded) {
    return (
      <div className="space-y-2">
        {weekNav ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <WeekNavLinks
              weekLabel={payWeekLabel!}
              prevHref={payWeekPrevHref!}
              nextHref={payWeekNextHref!}
              compact
            />
          </div>
        ) : null}
        {detailerList}
      </div>
    );
  }

  return (
    <HubSection
      compact={!singleDetailer}
      className={cn(singleDetailer ? "mt-8" : undefined)}
      title={singleDetailer ? undefined : "Detailer pay"}
      description={
        singleDetailer
          ? undefined
          : "Flat pay per package and add-on by tier (Regular vs Senior). Excludes cancelled and deleted jobs · one calendar week at a time."
      }
      headerAction={
        !singleDetailer ? (
          <HubStatCard
            label={weekNav ? "Week total" : "Total in range"}
            value={formatPayCents(pay.grandTotalCents)}
            className="min-w-[8rem]"
          />
        ) : null
      }
    >
      {weekNav ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          {weekNav}
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Central Time · Mon–Sun
          </span>
        </div>
      ) : null}

      {!singleDetailer && !weekNav ? null : singleDetailer && !weekNav ? (
        <p className="mb-4 font-mono text-[9px] text-muted-foreground">
          {pay.from} → {pay.to} · Central appointment dates · grouped by week (Mon–Sun)
        </p>
      ) : null}

      {detailerList}
    </HubSection>
  );
}

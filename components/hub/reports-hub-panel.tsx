import Link from "next/link";

import { ReportsAutoRefresh } from "@/components/hub/reports-auto-refresh";
import { HubDetailsSection } from "@/components/hub/hub-page";
import { HubFormField, HubInput } from "@/components/hub/hub-form";
import { ReportsDetailerPaySection } from "@/components/hub/reports-detailer-pay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCentralTodayDateInput } from "@/lib/bookings/scheduling-limits";
import type { DetailerPayReport } from "@/lib/hub/detailer-pay-report";
import {
  formatReportCents,
  formatReportHours,
  type HubReportsSnapshot,
  type ReportBreakdownRow,
} from "@/lib/hub/reports-db";
import { cn } from "@/lib/utils";

export function ReportsPeriodForm({
  from,
  to,
  preset,
  action = "/hub/reports",
  showThisWeek,
  compact,
}: {
  from: string;
  to: string;
  preset?: string;
  action?: string;
  showThisWeek?: boolean;
  compact?: boolean;
}) {
  const today = getCentralTodayDateInput();
  const monthStart = `${today.slice(0, 7)}-01`;

  function presetLink(p: string) {
    return `${action}?preset=${p}`;
  }

  const thisMonthActive = !preset && from === monthStart && to === today;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {showThisWeek ? (
          <Button
            asChild
            variant={preset === "thisWeek" ? "default" : "outline"}
            size="xs"
          >
            <Link href={presetLink("thisWeek")}>This week</Link>
          </Button>
        ) : null}
        <Button
          asChild
          variant={thisMonthActive ? "default" : "outline"}
          size="xs"
        >
          <Link href={`${action}?from=${monthStart}&to=${today}`}>This month</Link>
        </Button>
        <Button
          asChild
          variant={preset === "last30" ? "default" : "outline"}
          size="xs"
        >
          <Link href={presetLink("last30")}>30 days</Link>
        </Button>
        <Button
          asChild
          variant={preset === "lastMonth" ? "default" : "outline"}
          size="xs"
        >
          <Link href={presetLink("lastMonth")}>Last month</Link>
        </Button>
        <form
          method="get"
          action={action}
          className="flex flex-wrap items-center gap-1.5 border-l border-border/60 pl-2"
        >
          <HubInput
            type="date"
            name="from"
            required
            defaultValue={from}
            className="hub-date-input h-7 w-[8.5rem] text-[11px]"
            aria-label="From date"
          />
          <span className="font-mono text-[9px] text-muted-foreground">→</span>
          <HubInput
            type="date"
            name="to"
            required
            defaultValue={to}
            className="hub-date-input h-7 w-[8.5rem] text-[11px]"
            aria-label="To date"
          />
          <Button type="submit" size="xs" variant="outline">
            Apply
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Card className="border-border/80 bg-card/40">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Date range
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {showThisWeek ? (
            <Button
              asChild
              variant={preset === "thisWeek" ? "default" : "outline"}
              size="sm"
            >
              <Link href={presetLink("thisWeek")}>This week</Link>
            </Button>
          ) : null}
          <Button
            asChild
            variant={thisMonthActive ? "default" : "outline"}
            size="sm"
          >
            <Link href={`${action}?from=${monthStart}&to=${today}`}>This month</Link>
          </Button>
          <Button
            asChild
            variant={preset === "last30" ? "default" : "outline"}
            size="sm"
          >
            <Link href={presetLink("last30")}>Last 30 days</Link>
          </Button>
          <Button
            asChild
            variant={preset === "lastMonth" ? "default" : "outline"}
            size="sm"
          >
            <Link href={presetLink("lastMonth")}>Last month</Link>
          </Button>
        </div>
        <form method="get" action={action} className="flex flex-wrap items-end gap-3">
          <HubFormField label="From" htmlFor="reports-from" required>
            <HubInput
              id="reports-from"
              type="date"
              name="from"
              required
              defaultValue={from}
              className="hub-date-input"
            />
          </HubFormField>
          <HubFormField label="To" htmlFor="reports-to" required>
            <HubInput
              id="reports-to"
              type="date"
              name="to"
              required
              defaultValue={to}
              className="hub-date-input"
            />
          </HubFormField>
          <Button type="submit" size="sm">
            Update range
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CompactStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-md border border-border/80 bg-card/50 px-2.5 py-1.5">
      <p className="truncate font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-base leading-tight text-foreground">{value}</p>
      {sub ? (
        <p className="truncate font-mono text-[8px] text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  showHours,
  compact,
}: {
  title: string;
  subtitle?: string;
  rows: ReportBreakdownRow[];
  showHours?: boolean;
  compact?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex min-h-0 flex-col overflow-hidden border-border/80",
        compact && "h-full",
      )}
    >
      <CardHeader className="shrink-0 border-b border-border/60 px-3 py-1.5">
        <CardTitle className="font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto p-0">
        {rows.length ? (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 font-mono text-[8px] uppercase text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="h-7 px-2 text-right font-mono text-[8px] uppercase text-muted-foreground">
                  Jobs
                </TableHead>
                {showHours ? (
                  <TableHead className="h-7 px-2 text-right font-mono text-[8px] uppercase text-muted-foreground">
                    Hrs
                  </TableHead>
                ) : null}
                <TableHead className="h-7 px-2 text-right font-mono text-[8px] uppercase text-muted-foreground">
                  Rev
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} className="font-mono text-[10px]">
                  <TableCell className="max-w-[7rem] truncate px-2 py-1">
                    {row.label}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-right text-muted-foreground">
                    {row.count}
                  </TableCell>
                  {showHours ? (
                    <TableCell className="px-2 py-1 text-right text-muted-foreground">
                      {formatReportHours(row.hours)}
                    </TableCell>
                  ) : null}
                  <TableCell className="px-2 py-1 text-right text-primary">
                    {formatReportCents(row.revenueCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-3 py-4 text-center font-mono text-[10px] text-muted-foreground">
            No data
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsHubPanel({
  report,
  detailerPay,
  payWeekLabel,
  payWeekPrevHref,
  payWeekNextHref,
  compact = true,
}: {
  report: HubReportsSnapshot;
  detailerPay: DetailerPayReport;
  payWeekLabel: string;
  payWeekPrevHref: string;
  payWeekNextHref: string;
  compact?: boolean;
}) {
  const { summary } = report;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 gap-1.5">
        <CompactStat
          label="Revenue"
          value={formatReportCents(summary.revenueCents)}
          sub={`${summary.countedJobs} billable`}
        />
        <CompactStat label="Avg / job" value={formatReportCents(summary.avgJobCents)} />
        <CompactStat
          label="Promos"
          value={formatReportCents(summary.discountCents)}
        />
        <CompactStat
          label="Hours"
          value={formatReportHours(summary.scheduledHours)}
        />
        <CompactStat
          label="Total jobs"
          value={String(summary.totalJobs)}
          sub={`${summary.cancelledJobs} cancelled`}
        />
        <CompactStat label="Billable" value={String(summary.countedJobs)} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
        <BreakdownTable
          compact
          title="By package"
          rows={report.byPackage}
        />
        <BreakdownTable
          compact
          title="Detailers"
          rows={report.byDetailer}
          showHours
        />
        <BreakdownTable compact title="Add-ons" rows={report.byAddon} />
        <BreakdownTable compact title="By city" rows={report.byCity} />
      </div>

      <HubDetailsSection
        summary={`Detailer pay · ${payWeekLabel} · ${formatReportCents(detailerPay.grandTotalCents)}`}
        className="shrink-0 [&_summary]:py-2"
        contentClassName="max-h-40 overflow-y-auto px-3 py-2"
      >
        <ReportsDetailerPaySection
          pay={detailerPay}
          payWeekLabel={payWeekLabel}
          payWeekPrevHref={payWeekPrevHref}
          payWeekNextHref={payWeekNextHref}
          embedded
        />
      </HubDetailsSection>
    </div>
  );
}

/** Full-height reports dashboard: toolbar, stats, 2×2 tables, collapsible pay. */
export function ReportsDashboard({
  from,
  to,
  preset,
  report,
  detailerPay,
  payWeekLabel,
  payWeekPrevHref,
  payWeekNextHref,
}: {
  from: string;
  to: string;
  preset?: string;
  report: HubReportsSnapshot;
  detailerPay: DetailerPayReport;
  payWeekLabel: string;
  payWeekPrevHref: string;
  payWeekNextHref: string;
}) {
  return (
    <div className="flex h-[calc(100svh-3.5rem-2rem)] max-h-[calc(100svh-3.5rem-2rem)] flex-col gap-2 overflow-hidden md:h-[calc(100svh-3.5rem-4rem)] md:max-h-[calc(100svh-3.5rem-4rem)] md:gap-2.5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h1 className="font-display text-2xl uppercase tracking-[0.04em] text-primary md:text-3xl">
            Reports
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <ReportsAutoRefresh />
            <span className="font-mono text-[9px] text-muted-foreground">
              {report.from} → {report.to} · Central
            </span>
          </div>
        </div>
        <ReportsPeriodForm from={from} to={to} preset={preset} compact />
      </div>

      <ReportsHubPanel
        report={report}
        detailerPay={detailerPay}
        payWeekLabel={payWeekLabel}
        payWeekPrevHref={payWeekPrevHref}
        payWeekNextHref={payWeekNextHref}
        compact
      />
    </div>
  );
}

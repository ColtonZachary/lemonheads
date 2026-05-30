import Link from "next/link";

import { ReportsAutoRefresh } from "@/components/hub/reports-auto-refresh";
import { ReportsStatsPanel } from "@/components/hub/reports-stats-panel";
import type { WebsitePerformanceSnapshot } from "@/lib/hub/website-performance-stats";
import { HubPageHeader, HubStatCard } from "@/components/hub/hub-page";
import { HubFieldRow, HubFormField, HubInput } from "@/components/hub/hub-form";
import { ReportsDetailerPaySection } from "@/components/hub/reports-detailer-pay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function ReportsSummaryStrip({ report }: { report: HubReportsSnapshot }) {
  const { summary } = report;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="font-mono text-xs font-normal">
          {report.from} → {report.to} · Central appointment dates
        </Badge>
        <ReportsAutoRefresh />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <HubStatCard
          label="Revenue"
          value={formatReportCents(summary.revenueCents)}
          sub={`${summary.countedJobs} billable jobs`}
        />
        <HubStatCard label="Avg per job" value={formatReportCents(summary.avgJobCents)} />
        <HubStatCard
          label="Promo discounts"
          value={formatReportCents(summary.discountCents)}
        />
        <HubStatCard
          label="Scheduled hours"
          value={formatReportHours(summary.scheduledHours)}
        />
        <HubStatCard
          label="Total jobs"
          value={String(summary.totalJobs)}
          sub={`${summary.cancelledJobs} cancelled`}
        />
        <HubStatCard label="Billable jobs" value={String(summary.countedJobs)} />
      </div>
    </div>
  );
}

export function ReportsPeriodForm({
  from,
  to,
  preset,
  action = "/hub/reports",
  showThisWeek,
}: {
  from: string;
  to: string;
  preset?: string;
  action?: string;
  showThisWeek?: boolean;
}) {
  const today = getCentralTodayDateInput();
  const monthStart = `${today.slice(0, 7)}-01`;

  function presetLink(p: string) {
    return `${action}?preset=${p}`;
  }

  const thisMonthActive = !preset && from === monthStart && to === today;

  return (
    <Card className="border-border/80 bg-card/40">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Date range
        </CardTitle>
        <CardDescription className="text-sm">
          Appointment dates in America/Chicago · revenue excludes cancelled and deleted
          jobs
        </CardDescription>
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
        <form method="get" action={action}>
          <HubFieldRow className="items-end">
            <HubFormField label="From (Central)" htmlFor="reports-from" required>
              <HubInput
                id="reports-from"
                type="date"
                name="from"
                required
                defaultValue={from}
                className="hub-date-input"
              />
            </HubFormField>
            <HubFormField label="To (Central)" htmlFor="reports-to" required>
              <HubInput
                id="reports-to"
                type="date"
                name="to"
                required
                defaultValue={to}
                className="hub-date-input"
              />
            </HubFormField>
            <div className="flex items-end pb-0.5">
              <Button type="submit" size="sm">
                Update range
              </Button>
            </div>
          </HubFieldRow>
        </form>
      </CardContent>
    </Card>
  );
}

function BreakdownTable({
  title,
  subtitle,
  rows,
  showHours,
}: {
  title: string;
  subtitle: string;
  rows: ReportBreakdownRow[];
  showHours?: boolean;
}) {
  return (
    <Card className="flex flex-col border-border/80">
      <CardHeader className="border-b border-border/60 pb-3">
        <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="h-10 px-4 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  Jobs
                </TableHead>
                {showHours ? (
                  <TableHead className="h-10 px-4 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    Hours
                  </TableHead>
                ) : null}
                <TableHead className="h-10 px-4 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  Revenue
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} className="font-mono text-sm">
                  <TableCell className="px-4 py-2.5">{row.label}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-muted-foreground">
                    {row.count}
                  </TableCell>
                  {showHours ? (
                    <TableCell className="px-4 py-2.5 text-right text-muted-foreground">
                      {formatReportHours(row.hours)}
                    </TableCell>
                  ) : null}
                  <TableCell className="px-4 py-2.5 text-right font-medium text-primary">
                    {formatReportCents(row.revenueCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No data in this range.
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
}: {
  report: HubReportsSnapshot;
  detailerPay: DetailerPayReport;
  payWeekLabel: string;
  payWeekPrevHref: string;
  payWeekNextHref: string;
}) {
  return (
    <div className="space-y-8">
      <ReportsSummaryStrip report={report} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownTable
          title="Revenue by package"
          subtitle="Grouped by service name on the booking"
          rows={report.byPackage}
        />
        <BreakdownTable
          title="Detailer utilization"
          subtitle="Jobs and scheduled hours per detailer"
          rows={report.byDetailer}
          showHours
        />
        <BreakdownTable
          title="Add-ons"
          subtitle="Times selected · revenue is catalog price per job"
          rows={report.byAddon}
        />
        <BreakdownTable
          title="By city"
          subtitle="Customer city on the booking"
          rows={report.byCity}
        />
      </div>

      <ReportsDetailerPaySection
        pay={detailerPay}
        payWeekLabel={payWeekLabel}
        payWeekPrevHref={payWeekPrevHref}
        payWeekNextHref={payWeekNextHref}
      />
    </div>
  );
}

export function ReportsDashboard({
  from,
  to,
  preset,
  report,
  detailerPay,
  payWeekLabel,
  payWeekPrevHref,
  payWeekNextHref,
  initialTab,
  sitePerformance,
}: {
  from: string;
  to: string;
  preset?: string;
  report: HubReportsSnapshot;
  detailerPay: DetailerPayReport;
  payWeekLabel: string;
  payWeekPrevHref: string;
  payWeekNextHref: string;
  initialTab?: "overview" | "stats";
  sitePerformance: WebsitePerformanceSnapshot;
}) {
  return (
    <div className="max-w-6xl">
      <HubPageHeader
        title="Reports"
        description="Revenue, detailer hours, packages, add-ons, and cities · Central dates"
      />

      <div className="mt-6">
        <ReportsPeriodForm from={from} to={to} preset={preset} />
      </div>

      <Tabs
        defaultValue={initialTab ?? "overview"}
        className="mt-8 flex flex-col-reverse gap-6"
      >
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-1 rounded-none border-t border-border bg-transparent p-0 pt-4"
        >
          <TabsTrigger value="overview" className="font-mono text-[10px] uppercase">
            Overview
          </TabsTrigger>
          <TabsTrigger value="stats" className="font-mono text-[10px] uppercase">
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-0">
          <ReportsStatsPanel sitePerformance={sitePerformance} />
        </TabsContent>

        <TabsContent value="overview" className="mt-0">
          <ReportsHubPanel
            report={report}
            detailerPay={detailerPay}
            payWeekLabel={payWeekLabel}
            payWeekPrevHref={payWeekPrevHref}
            payWeekNextHref={payWeekNextHref}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

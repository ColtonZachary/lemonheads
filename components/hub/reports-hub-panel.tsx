import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCentralTodayDateInput } from "@/lib/bookings/scheduling-limits";
import { ReportsDetailerPaySection } from "@/components/hub/reports-detailer-pay";
import type { DetailerPayReport } from "@/lib/hub/detailer-pay-report";
import {
  formatReportCents,
  formatReportHours,
  type HubReportsSnapshot,
  type ReportBreakdownRow,
} from "@/lib/hub/reports-db";
import { cn } from "@/lib/utils";

const labelClass =
  "font-mono text-[9px] uppercase tracking-[0.12em] text-text/40";
const fieldClass =
  "mt-1 rounded border border-white/15 bg-dk px-3 py-2 font-mono text-sm";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-card2 px-4 py-3">
      <p className={labelClass}>{label}</p>
      <p className="mt-1 font-mono text-sm text-y">{value}</p>
      {sub ? (
        <p className="mt-0.5 font-mono text-[9px] text-text/35">{sub}</p>
      ) : null}
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

  return (
    <div className="mt-8 space-y-4 rounded-md border border-white/10 bg-card2 p-5">
      <div className="flex flex-wrap gap-2">
        {showThisWeek ? (
          <Button
            asChild
            variant={preset === "thisWeek" ? "primary" : "outline"}
            size="sm"
            className={cn(preset === "thisWeek" && "border-y/40")}
          >
            <Link href={presetLink("thisWeek")}>This week</Link>
          </Button>
        ) : null}
        <Button
          asChild
          variant={
            !preset && from === monthStart && to === today ? "primary" : "outline"
          }
          size="sm"
          className={cn(
            !preset && from === monthStart && to === today && "border-y/40",
          )}
        >
          <Link href={`${action}?from=${monthStart}&to=${today}`}>
            This month
          </Link>
        </Button>
        <Button asChild variant={preset === "last30" ? "primary" : "outline"} size="sm">
          <Link href={presetLink("last30")}>Last 30 days</Link>
        </Button>
        <Button asChild variant={preset === "lastMonth" ? "primary" : "outline"} size="sm">
          <Link href={presetLink("lastMonth")}>Last month</Link>
        </Button>
      </div>

      <form method="get" action={action} className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className={labelClass}>From (Central)</span>
          <input
            type="date"
            name="from"
            required
            defaultValue={from}
            className={cn(fieldClass, "hub-date-input")}
          />
        </label>
        <label className="block">
          <span className={labelClass}>To (Central)</span>
          <input
            type="date"
            name="to"
            required
            defaultValue={to}
            className={cn(fieldClass, "hub-date-input")}
          />
        </label>
        <Button type="submit">Update range</Button>
      </form>
      <p className="font-mono text-[9px] text-text/35">
        Appointment dates in America/Chicago · revenue excludes cancelled and deleted
        jobs
      </p>
    </div>
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
    <div className="rounded-md border border-white/10">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          {title}
        </h2>
        <p className="mt-1 font-mono text-[9px] text-text/35">{subtitle}</p>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-card2/60 font-mono text-[9px] uppercase tracking-[0.14em] text-text/40">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-right">Jobs</th>
                {showHours ? (
                  <th className="px-4 py-3 text-right">Hours</th>
                ) : null}
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-white/5 font-mono text-xs text-text/70"
                >
                  <td className="px-4 py-3 text-text/85">{row.label}</td>
                  <td className="px-4 py-3 text-right text-text/55">{row.count}</td>
                  {showHours ? (
                    <td className="px-4 py-3 text-right text-text/55">
                      {formatReportHours(row.hours)}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-right text-y/90">
                    {formatReportCents(row.revenueCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="p-8 text-center font-mono text-xs text-text/40">
          No data in this range.
        </p>
      )}
    </div>
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
  const { summary } = report;

  return (
    <div className="mt-8 space-y-8">
      <p className="font-mono text-xs text-text/45">
        {report.from} → {report.to} · Central appointment dates
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Revenue"
          value={formatReportCents(summary.revenueCents)}
          sub={`${summary.countedJobs} billable jobs`}
        />
        <StatCard
          label="Avg per job"
          value={formatReportCents(summary.avgJobCents)}
        />
        <StatCard
          label="Promo discounts"
          value={formatReportCents(summary.discountCents)}
        />
        <StatCard
          label="Scheduled hours"
          value={formatReportHours(summary.scheduledHours)}
        />
        <StatCard
          label="Total jobs"
          value={String(summary.totalJobs)}
          sub={`${summary.cancelledJobs} cancelled`}
        />
        <StatCard
          label="Billable jobs"
          value={String(summary.countedJobs)}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
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
          subtitle="Times selected · revenue is catalog price per job (e.g. $50 × 4 jobs = $200)"
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

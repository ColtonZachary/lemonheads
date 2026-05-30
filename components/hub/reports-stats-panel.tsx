"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ReportsTrendStatCard } from "@/components/hub/reports-trend-stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  SiteUsageComparison,
  SiteUsageDailyPoint,
} from "@/lib/analytics/site-page-views";
import { addDaysToDateInput } from "@/lib/bookings/scheduling-limits";
import {
  formatSiteAvgRating,
  formatSitePercentChange,
  formatSiteRatingChange,
  sitePercentChange,
  siteRatingPointChange,
  type WebsitePerformanceSnapshot,
} from "@/lib/hub/website-performance-stats";

const chartConfig = {
  pageViews: {
    label: "Page views",
    color: "var(--chart-1)",
  },
  bookViews: {
    label: "Book page",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type ChartRow = {
  label: string;
  date: string;
  pageViews: number;
  bookViews: number;
};

type StatsWindow = "range" | "90" | "30" | "7";

function sliceUsageDaily(
  series: SiteUsageDailyPoint[],
  to: string,
  window: StatsWindow,
): SiteUsageDailyPoint[] {
  if (window === "range" || !series.length) return series;
  const days = window === "7" ? 7 : window === "30" ? 30 : 90;
  const from = addDaysToDateInput(to, -(days - 1));
  return series.filter((p) => p.date >= from && p.date <= to);
}

function usageTotalsFromDaily(
  series: SiteUsageDailyPoint[],
): { pageViews: number; bookViews: number } {
  let pageViews = 0;
  let bookViews = 0;
  for (const p of series) {
    pageViews += p.pageViews;
    bookViews += p.bookViews;
  }
  return { pageViews, bookViews };
}

function usageComparisonForWindow(
  full: SiteUsageComparison,
  dailySeries: SiteUsageDailyPoint[],
  to: string,
  window: StatsWindow,
): SiteUsageComparison {
  if (window === "range") return full;

  const currentSlice = sliceUsageDaily(dailySeries, to, window);
  if (!currentSlice.length) {
    return {
      ...full,
      current: { pageViews: 0, bookViews: 0, uniquePaths: 0 },
      prior: { pageViews: 0, bookViews: 0, uniquePaths: 0 },
    };
  }

  const days = currentSlice.length;
  const currentFrom = currentSlice[0]!.date;
  const priorTo = addDaysToDateInput(currentFrom, -1);
  const priorFrom = addDaysToDateInput(priorTo, -(days - 1));
  const priorSlice = dailySeries.filter(
    (p) => p.date >= priorFrom && p.date <= priorTo,
  );

  const current = usageTotalsFromDaily(currentSlice);
  const prior = usageTotalsFromDaily(priorSlice);

  return {
    priorFrom,
    priorTo,
    current: {
      pageViews: current.pageViews,
      bookViews: current.bookViews,
      uniquePaths: full.current.uniquePaths,
    },
    prior: {
      pageViews: prior.pageViews,
      bookViews: prior.bookViews,
      uniquePaths: full.prior.uniquePaths,
    },
  };
}

function windowSubtitle(window: StatsWindow, from: string, to: string): string {
  if (window === "range") return `Public site traffic · ${from} → ${to}`;
  if (window === "7") return "Last 7 days · page loads";
  if (window === "30") return "Last 30 days · page loads";
  return "Last 90 days · page loads";
}

function trendCopyViews(changePct: number | null, label: string): {
  trendLine: string;
  footnote: string;
} {
  if (changePct === null) {
    return {
      trendLine: `No prior ${label} to compare`,
      footnote: "Usage tracking started recently on the public site",
    };
  }
  const pct = formatSitePercentChange(changePct);
  if (changePct === 0) {
    return { trendLine: `Flat vs prior period (${pct})`, footnote: "Traffic holding steady" };
  }
  if (changePct > 0) {
    return {
      trendLine: `Up ${pct} vs prior period`,
      footnote: "More visitors browsing the site",
    };
  }
  return {
    trendLine: `Down ${pct} vs prior period`,
    footnote: "Lighter traffic this period",
  };
}

function trendCopyRating(pointChange: number | null): {
  trendLine: string;
  footnote: string;
} {
  if (pointChange === null) {
    return {
      trendLine: "No prior ratings to compare",
      footnote: "From /feedback submissions",
    };
  }
  const pts = formatSiteRatingChange(pointChange);
  if (pointChange === 0) {
    return { trendLine: `Unchanged (${pts} pts)`, footnote: "Experience score holding steady" };
  }
  if (pointChange > 0) {
    return {
      trendLine: `Up ${pts} points vs prior period`,
      footnote: "Visitors rating the site higher",
    };
  }
  return {
    trendLine: `Down ${pts} points vs prior period`,
    footnote: "Worth reviewing recent feedback",
  };
}

export function ReportsStatsPanel({
  sitePerformance,
}: {
  sitePerformance: WebsitePerformanceSnapshot;
}) {
  const { from, to, usage, comparison: feedbackComparison } = sitePerformance;
  const [window, setWindow] = useState<StatsWindow>("range");

  const usageComparison = useMemo(
    () => usageComparisonForWindow(usage.comparison, usage.dailySeries, to, window),
    [usage.comparison, usage.dailySeries, to, window],
  );

  const chartData = useMemo(() => {
    const sliced = sliceUsageDaily(usage.dailySeries, to, window);
    return sliced.map(
      (p): ChartRow => ({
        label: p.label,
        date: p.date,
        pageViews: p.pageViews,
        bookViews: p.bookViews,
      }),
    );
  }, [usage.dailySeries, to, window]);

  const tickInterval = useMemo(() => {
    const n = chartData.length;
    if (n <= 14) return 0;
    if (n <= 45) return 6;
    return Math.floor(n / 8);
  }, [chartData.length]);

  const hasUsageData = chartData.some((d) => d.pageViews > 0);

  const { current: usageCurrent, prior: usagePrior } = usageComparison;
  const pageViewsPct = sitePercentChange(
    usageCurrent.pageViews,
    usagePrior.pageViews,
  );
  const bookViewsPct = sitePercentChange(
    usageCurrent.bookViews,
    usagePrior.bookViews,
  );

  const { current: feedbackCurrent } = feedbackComparison;
  const ratingPts = siteRatingPointChange(
    feedbackCurrent.avgRating,
    feedbackComparison.prior.avgRating,
  );

  const pageViewsTrend = trendCopyViews(pageViewsPct, "page views");
  const bookViewsTrend = trendCopyViews(bookViewsPct, "book visits");
  const ratingTrend = trendCopyRating(ratingPts);

  const priorLabel = `${usageComparison.priorFrom} → ${usageComparison.priorTo}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Public site usage and experience — page loads on marketing pages, not hub
          or revenue.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/hub/website-feedback">Site feedback →</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReportsTrendStatCard
          title="Page views"
          value={usageCurrent.pageViews.toLocaleString()}
          changePct={pageViewsPct}
          trendLine={pageViewsTrend.trendLine}
          footnote={pageViewsTrend.footnote}
        />
        <ReportsTrendStatCard
          title="Book page views"
          value={usageCurrent.bookViews.toLocaleString()}
          changePct={bookViewsPct}
          trendLine={bookViewsTrend.trendLine}
          footnote={bookViewsTrend.footnote}
        />
        <ReportsTrendStatCard
          title="Avg site rating"
          value={formatSiteAvgRating(feedbackCurrent.avgRating)}
          changePct={ratingPts}
          badgeLabel={formatSiteRatingChange(ratingPts)}
          trendLine={ratingTrend.trendLine}
          footnote={ratingTrend.footnote}
        />
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
        Usage vs prior period {priorLabel} · Central time · one view per page per visit
      </p>

      <Card className="border-border/80 bg-card/40 pt-0">
        <CardHeader className="flex flex-col items-stretch gap-3 border-b border-border/60 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Website usage
            </CardTitle>
            <CardDescription>{windowSubtitle(window, from, to)}</CardDescription>
          </div>
          <ToggleGroup
            type="single"
            value={window}
            onValueChange={(v) => {
              if (v) setWindow(v as StatsWindow);
            }}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <ToggleGroupItem value="range" className="font-mono text-[10px] uppercase">
              Full range
            </ToggleGroupItem>
            <ToggleGroupItem value="90" className="font-mono text-[10px] uppercase">
              Last 90 days
            </ToggleGroupItem>
            <ToggleGroupItem value="30" className="font-mono text-[10px] uppercase">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7" className="font-mono text-[10px] uppercase">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6">
          {!hasUsageData ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No page views in this window yet. Views are recorded when visitors load
              pages on the public site (home, book, team, etc.) after the usage tracker
              is deployed.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-pageViews)"
                      stopOpacity={0.55}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-pageViews)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient id="fillBookViews" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-bookViews)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-bookViews)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <YAxis yAxisId="views" hide />
                <YAxis yAxisId="book" orientation="right" hide />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={tickInterval}
                  minTickGap={28}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const row = payload?.[0]?.payload as ChartRow | undefined;
                        return row?.date ?? "";
                      }}
                    />
                  }
                />
                <Area
                  yAxisId="views"
                  dataKey="pageViews"
                  type="monotone"
                  fill="url(#fillPageViews)"
                  fillOpacity={1}
                  stroke="var(--color-pageViews)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="book"
                  dataKey="bookViews"
                  type="monotone"
                  fill="url(#fillBookViews)"
                  fillOpacity={1}
                  stroke="var(--color-bookViews)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {usage.topPages.length > 0 ? (
        <Card className="border-border/80 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top pages this period</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 font-mono text-xs">
              {usage.topPages.map((p) => (
                <li key={p.path} className="flex justify-between gap-4 text-muted-foreground">
                  <span className="truncate text-foreground/80">{p.path}</span>
                  <span className="shrink-0 tabular-nums text-primary">
                    {p.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
        Total page loads · book funnel (/book) highlighted
      </p>
    </div>
  );
}

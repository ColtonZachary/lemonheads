import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { formatSitePercentChange } from "@/lib/hub/website-performance-stats";
import { cn } from "@/lib/utils";

export function ReportsTrendStatCard({
  title,
  value,
  changePct,
  badgeLabel,
  trendLine,
  footnote,
  className,
}: {
  title: string;
  value: string;
  changePct: number | null;
  /** Override badge text (e.g. rating point change instead of %) */
  badgeLabel?: string;
  trendLine: string;
  footnote: string;
  className?: string;
}) {
  const trendingUp = changePct !== null && changePct >= 0;
  const TrendIcon = trendingUp ? TrendingUp : TrendingDown;
  const badgeText = badgeLabel ?? formatSitePercentChange(changePct);

  return (
    <Card className={cn("border-border/80 bg-card/40", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-sm font-medium text-muted-foreground">
          {title}
        </CardDescription>
        <Badge variant="outline" className="gap-1 font-mono text-[10px] font-normal">
          <TrendIcon className="size-3 shrink-0" />
          {badgeText}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendIcon className="size-3 shrink-0" />
            {trendLine}
          </p>
          <p className="text-xs text-muted-foreground/80">{footnote}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function HubActionAlert({
  state,
  className,
}: {
  state: { ok: boolean; message: string };
  className?: string;
}) {
  if (!state.message) return null;
  return (
    <Alert variant={state.ok ? "default" : "destructive"} className={className}>
      <AlertDescription className="font-mono text-xs">{state.message}</AlertDescription>
    </Alert>
  );
}

export function HubEmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-md border border-dashed border-border px-6 py-10 text-center font-mono text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Native &lt;details&gt; styled for hub add-forms and collapsible sections. */
export function HubDetailsSection({
  summary,
  children,
  className,
  contentClassName,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <details
      className={cn(
        "group rounded-lg border border-border bg-card/30",
        className,
      )}
    >
      <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:text-primary/80 [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className={cn("border-t border-border px-4 py-4", contentClassName)}>
        {children}
      </div>
    </details>
  );
}

export function HubPageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="font-display text-4xl uppercase tracking-[0.04em] text-primary md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function HubStatCard({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "min-w-[10rem] flex-none border-border/80 bg-card/60",
        className,
      )}
    >
      <CardHeader className="gap-1.5 px-4 py-4">
        <CardDescription className="font-mono text-[9px] uppercase tracking-[0.14em]">
          {label}
        </CardDescription>
        <CardTitle className="font-display text-3xl font-normal tracking-[0.04em] text-foreground md:text-4xl">
          {value}
        </CardTitle>
        {sub ? (
          <p className="font-mono text-[9px] text-muted-foreground">{sub}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}

export function HubSection({
  title,
  description,
  children,
  className,
  compact,
  headerAction,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Tighter padding for dense hub detail panels */
  compact?: boolean;
  headerAction?: ReactNode;
}) {
  return (
    <Card className={cn("border-border/80", className)}>
      {title ? (
        <CardHeader
          className={cn(
            compact && "flex flex-row items-start justify-between gap-3 space-y-0 px-4 py-3",
          )}
        >
          <div className="min-w-0 flex-1">
            <CardTitle className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription
                className={cn(
                  compact && "mt-0.5 line-clamp-2 text-[10px] leading-snug",
                )}
              >
                {description}
              </CardDescription>
            ) : null}
          </div>
          {headerAction ? (
            <div className="shrink-0">{headerAction}</div>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent
        className={cn(
          title ? (compact ? "px-4 pb-4 pt-0" : undefined) : "pt-6",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

export function HubSettingsLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/30"
    >
      <div>
        <span className="font-mono text-sm text-primary">{title}</span>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
        Open →
      </span>
    </Link>
  );
}

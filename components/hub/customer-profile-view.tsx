"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BookingPriceDisplay } from "@/components/hub/booking-price-display";
import { HubFormField, HubInput } from "@/components/hub/hub-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatCentralDate,
  formatCentralDateTime,
} from "@/lib/hub/format";
import {
  formatCustomerTotalSpent,
  type CustomerProfile,
} from "@/lib/hub/customer-search";
import { cn } from "@/lib/utils";

type BookingTab = "all" | "active" | "completed" | "cancelled" | "removed";

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "in_progress"]);

function statusBadgeVariant(
  status: string,
  deleted: boolean,
): "default" | "secondary" | "destructive" | "outline" {
  if (deleted) return "destructive";
  if (status === "completed") return "default";
  if (status === "cancelled") return "destructive";
  if (ACTIVE_STATUSES.has(status)) return "secondary";
  return "outline";
}

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
    <Card className="border-border/80 bg-card/40 py-0">
      <CardContent className="px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-mono text-sm text-primary">{value}</p>
        {sub ? (
          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CustomerProfileView({ profile }: { profile: CustomerProfile }) {
  const [tab, setTab] = useState<BookingTab>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const activeBookings = profile.bookings.filter((b) => !b.deleted_at);
  const removedCount = profile.bookings.length - activeBookings.length;

  const filteredBookings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profile.bookings.filter((b) => {
      const deleted = Boolean(b.deleted_at);

      if (tab === "removed") {
        if (!deleted) return false;
      } else if (!includeRemoved && deleted) {
        return false;
      } else {
        switch (tab) {
          case "active":
            if (deleted || !ACTIVE_STATUSES.has(b.status)) return false;
            break;
          case "completed":
            if (deleted || b.status !== "completed") return false;
            break;
          case "cancelled":
            if (deleted || b.status !== "cancelled") return false;
            break;
          case "all":
          default:
            break;
        }
      }

      if (statusFilter !== "all" && !deleted && b.status !== statusFilter) {
        return false;
      }

      if (q) {
        const haystack = [
          b.reference_id,
          b.service_name,
          b.detailer_name ?? "",
          b.status,
          deleted ? "deleted" : "",
          formatCentralDateTime(b.starts_at),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [profile.bookings, tab, statusFilter, query, includeRemoved]);

  const tabCounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (b: (typeof profile.bookings)[0]) => {
      if (!q) return true;
      const haystack = [
        b.reference_id,
        b.service_name,
        b.detailer_name ?? "",
        b.status,
        b.deleted_at ? "deleted" : "",
        formatCentralDateTime(b.starts_at),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    };

    const base = profile.bookings.filter(matchesQuery);
    return {
      all: base.filter((b) => includeRemoved || !b.deleted_at).length,
      active: base.filter((b) => !b.deleted_at && ACTIVE_STATUSES.has(b.status))
        .length,
      completed: base.filter((b) => !b.deleted_at && b.status === "completed")
        .length,
      cancelled: base.filter((b) => !b.deleted_at && b.status === "cancelled")
        .length,
      removed: base.filter((b) => b.deleted_at).length,
    };
  }, [profile.bookings, query, includeRemoved]);

  function clearFilters() {
    setTab("all");
    setStatusFilter("all");
    setQuery("");
    setIncludeRemoved(false);
  }

  const hasFilters =
    tab !== "all" ||
    statusFilter !== "all" ||
    query.trim().length > 0 ||
    includeRemoved;

  return (
    <div className="mt-8">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-8 md:px-8">
        <p className="font-mono text-[9px] text-muted-foreground">
          <Link
            href="/hub/customers"
            className="text-primary hover:underline"
          >
            ← New search
          </Link>
        </p>

        <Card className="mt-3 border-border/80 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-2xl tracking-[0.06em] text-primary md:text-3xl">
              {profile.displayName || "Unknown"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {profile.email ? (
              <p className="font-mono text-sm text-foreground/80">{profile.email}</p>
            ) : null}
            {profile.phone ? (
              <p className="font-mono text-sm text-muted-foreground">{profile.phone}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Jobs"
            value={String(profile.bookingCount)}
            sub={`${activeBookings.length} active · ${removedCount} removed`}
          />
          <StatCard
            label="Total spent"
            value={formatCustomerTotalSpent(profile.totalSpentCents)}
            sub="Non-deleted jobs with final price"
          />
          <StatCard
            label="First job"
            value={
              profile.firstBookingAt
                ? formatCentralDate(profile.firstBookingAt)
                : "—"
            }
          />
          <StatCard
            label="Last job"
            value={
              profile.lastBookingAt
                ? formatCentralDate(profile.lastBookingAt)
                : "—"
            }
          />
        </div>

        <div className="mt-4 space-y-3">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as BookingTab)}
            className="gap-3"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
              <TabsTrigger value="all" className="font-mono text-[10px] uppercase">
                All ({tabCounts.all})
              </TabsTrigger>
              <TabsTrigger value="active" className="font-mono text-[10px] uppercase">
                Active ({tabCounts.active})
              </TabsTrigger>
              <TabsTrigger value="completed" className="font-mono text-[10px] uppercase">
                Done ({tabCounts.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="font-mono text-[10px] uppercase">
                Cancelled ({tabCounts.cancelled})
              </TabsTrigger>
              {removedCount > 0 ? (
                <TabsTrigger
                  value="removed"
                  className="font-mono text-[10px] uppercase"
                >
                  Removed ({tabCounts.removed})
                </TabsTrigger>
              ) : null}
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <HubFormField
              label="Search jobs"
              htmlFor="booking-filter-q"
              className="min-w-0 flex-1 sm:min-w-[200px]"
            >
              <HubInput
                id="booking-filter-q"
                type="search"
                placeholder="Ref, service, detailer, date…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </HubFormField>

            <div className="w-full sm:w-44">
              <Label className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                disabled={tab === "removed"}
              >
                <SelectTrigger className="mt-1 w-full font-mono text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pb-0.5 sm:pb-1">
              <Switch
                id="include-removed"
                checked={includeRemoved}
                onCheckedChange={setIncludeRemoved}
                disabled={tab === "removed"}
              />
              <Label
                htmlFor="include-removed"
                className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
              >
                Show removed in list
              </Label>
            </div>

            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="font-mono text-[10px] uppercase"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : null}
          </div>

          <p className="font-mono text-[9px] text-muted-foreground">
            Showing {filteredBookings.length} of {profile.bookings.length} job
            {profile.bookings.length === 1 ? "" : "s"}
            {hasFilters ? " (filtered)" : ""}
          </p>
        </div>
      </div>

      <Card className="mt-4 overflow-hidden border-border/80">
        {!profile.bookings.length ? (
          <p className="p-8 text-center font-mono text-xs text-muted-foreground">
            No bookings for this customer.
          </p>
        ) : filteredBookings.length === 0 ? (
          <div className="space-y-3 p-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              No jobs match these filters.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="max-h-[min(70vh,720px)] overflow-auto">
            <Table className="min-w-[720px]">
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 font-mono text-[9px] uppercase tracking-[0.14em]">
                    When
                  </TableHead>
                  <TableHead className="px-4 font-mono text-[9px] uppercase tracking-[0.14em]">
                    Ref
                  </TableHead>
                  <TableHead className="px-4 font-mono text-[9px] uppercase tracking-[0.14em]">
                    Service
                  </TableHead>
                  <TableHead className="px-4 font-mono text-[9px] uppercase tracking-[0.14em]">
                    Detailer
                  </TableHead>
                  <TableHead className="px-4 font-mono text-[9px] uppercase tracking-[0.14em]">
                    Status
                  </TableHead>
                  <TableHead className="px-4 font-mono text-[9px] uppercase tracking-[0.14em]">
                    Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((b) => {
                  const deleted = Boolean(b.deleted_at);
                  const displayStatus = deleted ? "deleted" : b.status;
                  return (
                    <TableRow
                      key={b.id}
                      className={cn(deleted && "opacity-50")}
                    >
                      <TableCell className="px-4 font-mono text-xs">
                        {formatCentralDateTime(b.starts_at)}
                      </TableCell>
                      <TableCell className="px-4">
                        <Link
                          href={`/hub/bookings/${b.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {b.reference_id}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                        {b.service_name}
                      </TableCell>
                      <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                        {b.detailer_name ?? "—"}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge
                          variant={statusBadgeVariant(b.status, deleted)}
                          className="font-mono text-[9px] uppercase"
                        >
                          {displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        <BookingPriceDisplay booking={b} stacked />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

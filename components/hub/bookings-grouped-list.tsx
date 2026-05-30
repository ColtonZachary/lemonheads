import Link from "next/link";

import { BookingPriceDisplay } from "@/components/hub/booking-price-display";
import { HubEmptyState } from "@/components/hub/hub-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBookingsDayHeading } from "@/lib/hub/schedule-labels";
import {
  formatBookingTimeRange,
  type HubDateGroup,
} from "@/lib/hub/group-bookings";
import { cn } from "@/lib/utils";

export function BookingsGroupedList({
  groups,
  hideDayHeaders = false,
  emptyMessage,
  highlightDate,
}: {
  groups: HubDateGroup[];
  hideDayHeaders?: boolean;
  emptyMessage?: string;
  highlightDate?: string;
}) {
  if (!groups.length) {
    return (
      <HubEmptyState className="mt-8">
        {emptyMessage ?? (
          <>
            No bookings yet.{" "}
            <Link href="/hub/bookings/new" className="text-primary hover:underline">
              Create one
            </Link>
            .
          </>
        )}
      </HubEmptyState>
    );
  }

  return (
    <div className={hideDayHeaders ? "mt-4 space-y-6" : "mt-8 space-y-10"}>
      {groups.map((day) => (
        <section
          key={day.dateKey}
          id={`bookings-day-${day.dateKey}`}
          className={cn(highlightDate === day.dateKey && "scroll-mt-24")}
        >
          {!hideDayHeaders && (
            <h2
              className={cn(
                "sticky top-0 z-10 border-b py-3 font-display text-2xl tracking-[0.06em] backdrop-blur-sm",
                highlightDate === day.dateKey
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-background/95 text-primary",
              )}
            >
              {formatBookingsDayHeading(day.dateKey)}
            </h2>
          )}

          <div className="mt-4 space-y-4">
            {day.detailers.map((detailer) => (
              <Card
                key={`${day.dateKey}-${detailer.detailerKey}`}
                className="overflow-hidden border-border/80"
              >
                <CardHeader className="border-b border-border bg-muted/30 py-2.5">
                  <CardTitle className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
                    {detailer.detailerLabel}
                  </CardTitle>
                  <p className="font-mono text-[9px] text-muted-foreground">
                    {detailer.bookings.length} job
                    {detailer.bookings.length === 1 ? "" : "s"}
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-4 font-mono text-[9px] uppercase">
                          Time (CT)
                        </TableHead>
                        <TableHead className="px-4 font-mono text-[9px] uppercase">
                          Ref
                        </TableHead>
                        <TableHead className="px-4 font-mono text-[9px] uppercase">
                          Customer
                        </TableHead>
                        <TableHead className="px-4 font-mono text-[9px] uppercase">
                          Service
                        </TableHead>
                        <TableHead className="px-4 font-mono text-[9px] uppercase">
                          Status
                        </TableHead>
                        <TableHead className="px-4 font-mono text-[9px] uppercase">
                          Price
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailer.bookings.map((b) => (
                        <TableRow
                          key={b.id}
                          className={cn(b.deleted_at && "opacity-40")}
                        >
                          <TableCell className="px-4 font-mono text-xs whitespace-nowrap">
                            {formatBookingTimeRange(b)}
                          </TableCell>
                          <TableCell className="px-4 font-mono text-xs">
                            <Link
                              href={`/hub/bookings/${b.id}`}
                              className="text-primary hover:underline"
                            >
                              {b.reference_id}
                            </Link>
                          </TableCell>
                          <TableCell className="px-4">
                            <div>{b.customer_name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {b.phone}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 text-muted-foreground">
                            {b.service_name}
                          </TableCell>
                          <TableCell className="px-4">
                            <Badge
                              variant="outline"
                              className="font-mono text-[9px] uppercase"
                            >
                              {b.deleted_at ? "deleted" : b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4">
                            <BookingPriceDisplay booking={b} stacked />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
